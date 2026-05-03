import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import PdfProposal from '@/models/PdfProposal';
import PdfRevision from '@/models/PdfRevision';
import { enqueueRoutingJob } from '@/lib/queue';

export async function POST(request, { params }) {
  try {
    const user = await authenticateRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();

    const { uploadId } = params;
    const { decisions } = await request.json();

    if (!Array.isArray(decisions)) {
      return NextResponse.json({ error: 'decisions must be an array' }, { status: 400 });
    }

    // Apply proposal decisions + persist revisions.
    for (const d of decisions) {
      const { proposalId, action } = d || {};
      if (!proposalId || !['approve', 'reject'].includes(action)) continue;

      const proposalDoc = await PdfProposal.findOne({ _id: proposalId, pdfUploadId: uploadId, userId: user.userId });
      if (!proposalDoc) continue;

      const update =
        action === 'approve'
          ? { status: 'approved', approvedAt: new Date(), rejectedAt: null }
          : { status: 'rejected', rejectedAt: new Date(), approvedAt: null };

      await PdfProposal.findOneAndUpdate(
        { _id: proposalId, pdfUploadId: uploadId, userId: user.userId },
        update,
        { new: true }
      );

      await PdfRevision.create({
        pdfUploadId: uploadId,
        userId: user.userId,
        baseProposalId: proposalId,
        scope: proposalDoc.scope,
        targetId: proposalDoc.targetId,
        payload: { action },
        createdBy: user.userId,
      });
    }

    // Re-run routing to rebuild module-ready records from approved proposals.
    const graphJob = await enqueueRoutingJob({
      pdfUploadId: uploadId,
      userId: user.userId,
      subject: 'General',
    });

    // Wait for routing completion (FakeJob.finished() resolves when done).
    try {
      await graphJob.finished();
    } catch {
      // best-effort — don't block the response
    }

    const proposals = await PdfProposal.find({ pdfUploadId: uploadId, userId: user.userId })
      .sort({ createdAt: -1 })
      .limit(500);

    return NextResponse.json({ proposals });
  } catch (error) {
    console.error('Moderation POST error:', error);
    return NextResponse.json({ error: 'Failed to moderate proposals' }, { status: 500 });
  }
}

