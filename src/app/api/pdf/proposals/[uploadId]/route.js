import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import PdfProposal from '@/models/PdfProposal';

export async function GET(request, { params }) {
  try {
    const user = await authenticateRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();

    const { uploadId } = params;
    if (!uploadId) return NextResponse.json({ error: 'uploadId is required' }, { status: 400 });

    const proposals = await PdfProposal.find({ pdfUploadId: uploadId, userId: user.userId })
      .sort({ createdAt: -1 })
      .limit(500);

    return NextResponse.json({ proposals });
  } catch (error) {
    console.error('Proposals GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch proposals' }, { status: 500 });
  }
}

