import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { enqueueQuestionGenerationJob, enqueueRoutingJob } from '@/lib/queue';

export async function POST(request, { params }) {
  try {
    const user = await authenticateRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();

    const { uploadId } = params;
    if (!uploadId) return NextResponse.json({ error: 'uploadId is required' }, { status: 400 });

    const { scope = 'topic', targetId, targetCount = 80 } = await request.json();
    if (!targetId) return NextResponse.json({ error: 'targetId is required' }, { status: 400 });
    if (!['topic', 'chapter'].includes(scope)) {
      return NextResponse.json({ error: "scope must be 'topic' or 'chapter'" }, { status: 400 });
    }

    // v2: "chapterId" is treated as "topicId" in the question-generation worker.
    const qJob = await enqueueQuestionGenerationJob({
      pdfUploadId: uploadId,
      userId: user.userId,
      subject: 'General',
      chapterId: targetId,
      chapterContent: null,
      targetCount,
    });

    // Wait for question generation (FakeJob.finished() resolves when done).
    try {
      await qJob.finished();
    } catch {
      // best-effort
    }

    const routingJob = await enqueueRoutingJob({
      pdfUploadId: uploadId,
      userId: user.userId,
      subject: 'General',
    });

    // Wait for routing completion.
    try {
      await routingJob.finished();
    } catch {
      // best-effort
    }

    return NextResponse.json({ ok: true, qJobId: qJob.id, routingJobId: routingJob.id });
  } catch (error) {
    console.error('Regenerate POST error:', error);
    return NextResponse.json({ error: 'Failed to regenerate' }, { status: 500 });
  }
}

