import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import dbConnect from '@/lib/db';
import PdfUpload from '@/models/PdfUpload';
import ProcessedNote from '@/models/ProcessedNote';
import ProcessedMCQ from '@/models/ProcessedMCQ';
import Flashcard from '@/models/Flashcard';
import ContentBlock from '@/models/ContentBlock';

export async function DELETE(
  request,
  { params }
) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { uploadId } = params;

    // Find the PDF upload
    const pdfUpload = await PdfUpload.findOne({
      _id: uploadId,
      userId: user._id,
    });

    if (!pdfUpload) {
      return NextResponse.json({ error: 'PDF upload not found' }, { status: 404 });
    }

    // Delete all associated processed content
    await Promise.all([
      ProcessedNote.deleteMany({ pdfUploadId: uploadId, userId: user._id }),
      ProcessedMCQ.deleteMany({ pdfUploadId: uploadId, userId: user._id }),
      Flashcard.deleteMany({ pdfUploadId: uploadId, userId: user._id }),
      ContentBlock.deleteMany({ pdfUploadId: uploadId, userId: user._id }),
    ]);

    // Delete the PDF upload record
    await PdfUpload.findByIdAndDelete(uploadId);

    // TODO: Delete the actual file from cloud storage if using S3
    // if (pdfUpload.cloudUrl) {
    //   await deleteFromS3(pdfUpload.cloudUrl);
    // }

    return NextResponse.json({
      success: true,
      message: 'PDF upload and all associated content deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting PDF upload:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}