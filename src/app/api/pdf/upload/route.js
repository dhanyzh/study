import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import PdfUpload from '@/models/PdfUpload';
import { authenticateRequest } from '@/lib/auth';
import { enqueuePDFProcessing, initQueues } from '@/lib/queue';
import { ensurePDFWorkers } from '@/lib/pdf-workers';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request) {
  const logPrefix = `[PDF Upload API]`;
  try {
    const payload = authenticateRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file');
    const rawSubjectId = formData.get('subjectId');

    // Basic validation
    if (!file) {
      return NextResponse.json(
        { stage: 'upload', error: 'No file uploaded' },
        { status: 400 }
      );
    }
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { stage: 'upload', error: 'Only PDF files allowed', details: `Received: ${file.type || 'unknown'}` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { stage: 'upload', error: 'File too large (max 50MB)' },
        { status: 413 }
      );
    }

    // Create upload directory
    try { await fs.mkdir(UPLOAD_DIR, { recursive: true }); } catch {}

    // Save file to disk
    const filename = `pdf_${Date.now()}_${Math.random().toString(36).substring(7)}.pdf`;
    const filePath = path.join(UPLOAD_DIR, filename);
    console.log(`${logPrefix} Upload received: name="${file.name}" size=${buffer.length}`);
    try {
      await fs.writeFile(filePath, buffer);
    } catch (e) {
      return NextResponse.json(
        { stage: 'upload', error: 'Failed to save uploaded file', details: e?.message },
        { status: 500 }
      );
    }

    // Connect to database
    try {
      await dbConnect();
    } catch (dbErr) {
      try { await fs.unlink(filePath); } catch {}
      return NextResponse.json(
        { stage: 'upload', error: 'Database connection failed', details: dbErr.message },
        { status: 500 }
      );
    }

    // Fix IDs that might be invalid strings from local auth fallback
    const safeUserId = mongoose.Types.ObjectId.isValid(payload.userId)
      ? payload.userId
      : '65f0a0c9e0a0a00000000001';

    let safeSubjectId = undefined;
    let suggestedSubject = 'General';
    if (rawSubjectId) {
      if (mongoose.Types.ObjectId.isValid(rawSubjectId)) {
        safeSubjectId = rawSubjectId;
      } else {
        suggestedSubject = String(rawSubjectId);
      }
    }

    // Create upload record in DB
    let upload;
    try {
      upload = await PdfUpload.create({
        userId: safeUserId,
        subjectId: safeSubjectId,
        suggestedSubject,
        filename,
        originalName: file.name,
        fileSize: buffer.length,
        status: 'queued',
        currentStage: 'Queued for processing',
        progress: 0,
      });
      console.log(`${logPrefix} Created PdfUpload record: ${upload._id}`);
    } catch (createErr) {
      try { await fs.unlink(filePath); } catch {}
      return NextResponse.json(
        { stage: 'upload', error: 'Failed to create upload record', details: createErr.message },
        { status: 500 }
      );
    }

    // ─── FIRE-AND-FORGET: start the pipeline in the background ───
    // The FakeQueue is synchronous — it awaits the entire multi-stage pipeline.
    // We use setTimeout(0) to move processing out of the HTTP request lifecycle,
    // so the response is sent immediately while the pipeline runs in the background.
    const uploadId = upload._id.toString();
    const userId = String(upload.userId);
    const jobId = `pdf-${uploadId}`;

    setTimeout(async () => {
      try {
        console.log(`${logPrefix} [Background] Starting workers for ${uploadId}`);
        await ensurePDFWorkers();
        await enqueuePDFProcessing(uploadId, userId, filePath);
        console.log(`${logPrefix} [Background] Pipeline completed for ${uploadId}`);
      } catch (e) {
        console.error(`${logPrefix} [Background] Pipeline failed for ${uploadId}:`, e?.message || e);
        // Mark the upload as failed
        try {
          const failedUpload = await PdfUpload.findById(uploadId);
          if (failedUpload && failedUpload.status !== 'completed') {
            failedUpload.status = 'failed';
            failedUpload.currentStage = 'Processing failed';
            failedUpload.errorLog = failedUpload.errorLog || [];
            failedUpload.errorLog.push({
              message: e?.message || String(e),
              stage: 'pipeline',
              timestamp: new Date(),
            });
            await failedUpload.save();
          }
        } catch (dbErr) {
          console.error(`${logPrefix} [Background] Failed to update error status:`, dbErr.message);
        }
      }
    }, 0);

    // Return immediately
    return NextResponse.json({
      success: true,
      upload: {
        _id: upload._id,
        jobId,
        filename: upload.originalName,
        status: 'queued',
        message: 'PDF queued for processing.',
      },
    }, { status: 202 });

  } catch (error) {
    console.error(`${logPrefix} Unhandled upload error:`, error);
    return NextResponse.json(
      { stage: 'unknown', error: 'Upload failed', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
