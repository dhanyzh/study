import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import PdfLearningGraph from '@/models/PdfLearningGraph';
import PdfRevision from '@/models/PdfRevision';
import { enqueueRoutingJob, connection } from '@/lib/queue';
import { QueueEvents } from 'bullmq';

export async function POST(request, { params }) {
  try {
    const user = await authenticateRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();

    const { uploadId } = params;
    if (!uploadId) return NextResponse.json({ error: 'uploadId is required' }, { status: 400 });

    const { graph, reason = 'ui-edit', targetId = 'graph' } = await request.json();
    if (!graph) return NextResponse.json({ error: 'graph is required' }, { status: 400 });

    const graphDoc = await PdfLearningGraph.findOne({ pdfUploadId: uploadId, userId: user.userId }).sort({ createdAt: -1 });
    if (!graphDoc) return NextResponse.json({ error: 'LearningGraph not found' }, { status: 404 });

    graphDoc.graph = graph;
    await graphDoc.save();

    await PdfRevision.create({
      pdfUploadId: uploadId,
      userId: user.userId,
      baseProposalId: null,
      schemaVersion: '1.0',
      scope: 'topic',
      targetId: String(targetId),
      payload: { reason, graph },
      createdBy: user.userId,
    });

    // Rebuild module-ready records from the updated learning graph + approved proposals.
    const routingJob = await enqueueRoutingJob({
      pdfUploadId: uploadId,
      userId: user.userId,
      subject: 'General',
    });

    const routingEvents = new QueueEvents('pdf-routing', { connection });
    try {
      await routingJob.waitUntilFinished(routingEvents);
    } finally {
      try {
        await routingEvents.close();
      } catch {
        // ignore
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Revisions POST error:', error);
    return NextResponse.json({ error: 'Failed to save revisions' }, { status: 500 });
  }
}

