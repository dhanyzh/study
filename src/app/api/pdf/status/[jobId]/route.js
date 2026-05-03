/**
 * GET /api/pdf/status/:jobId — Get PDF processing job status
 */

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import PdfUpload from '@/models/PdfUpload';
import PdfLearningGraph from '@/models/PdfLearningGraph';
import { authenticateRequest } from '@/lib/auth';
import { getJobStatus } from '@/lib/queue';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const logPrefix = `[PDF Status API]`;
  try {
    const authHeader = request.headers.get('authorization');
    console.log(`${logPrefix} Auth Header:`, authHeader ? 'Present' : 'Missing');
    const payload = authenticateRequest(request);
    console.log(`${logPrefix} Payload:`, payload);
    
    if (!payload) {
      return NextResponse.json(
        { stage: 'status', error: 'Unauthorized', details: 'Missing/invalid JWT' },
        { status: 401 }
      );
    }

    // Next route handlers have had param-shape changes across versions/tools;
    // sometimes `params` is a Promise. Support both to avoid false 400s.
    const resolvedParams =
      params && typeof params?.then === 'function' ? await params : params;

    const jobId = resolvedParams?.jobId;
    if (!jobId || typeof jobId !== 'string') {
      return NextResponse.json(
        { stage: 'status', error: 'Job ID required', details: 'Missing route param jobId' },
        { status: 400 }
      );
    }

    try {
      await dbConnect();
    } catch (e) {
      console.error(`${logPrefix} Database connection failed`, e);
      return NextResponse.json(
        {
          stage: 'status',
          error: 'Database not connected',
          details: e?.message || String(e),
        },
        { status: 500 }
      );
    }

    // Support both direct queue job IDs and upload IDs
    let uploadId = jobId;
    if (jobId.startsWith('pdf-')) {
      uploadId = jobId.replace(/^pdf-/, '');
    }

    let safeUserId = mongoose.Types.ObjectId.isValid(payload.userId) 
      ? payload.userId 
      : '65f0a0c9e0a0a00000000001';

    const upload = await PdfUpload.findOne({
      _id: uploadId,
      userId: safeUserId,
    });

    if (!upload) {
      return NextResponse.json(
        { stage: 'status', error: 'Job not found', details: `uploadId=${uploadId}` },
        { status: 404 }
      );
    }

    const queueJobId = jobId.startsWith('pdf-') ? jobId : `pdf-${uploadId}`;
    const jobStatus = await getJobStatus(queueJobId);

    let learningGraph = null;
    if (upload.status === 'completed') {
      // Avoid extra DB work on in-progress uploads.
      const graphDoc = upload.learningGraphId
        ? await PdfLearningGraph.findOne({ _id: upload.learningGraphId, userId: safeUserId })
        : await PdfLearningGraph.findOne({ pdfUploadId: upload._id, userId: safeUserId }).sort({ createdAt: -1 });
      learningGraph = graphDoc?.graph || null;
    }

    return NextResponse.json({
      upload: {
        _id: upload._id,
        filename: upload.originalName,
        status: upload.status,
        currentStage: upload.currentStage,
        progress: upload.progress,
        pageCount: upload.pageCount,
        errorLog: upload.errorLog || [],
        completedAt: upload.completedAt,
      },
      queueJob: jobStatus,
      processedContent: upload.status === 'completed' ? upload.aiProcessedContent : null,
      learningGraph,
    });
  } catch (error) {
    console.error(`${logPrefix} Unhandled error:`, error);
    return NextResponse.json(
      {
        stage: 'status',
        error: 'Failed to get status',
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
