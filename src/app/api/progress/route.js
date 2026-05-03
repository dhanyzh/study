/**
 * GET /api/progress?userId=xxx&subjectId=xxx — Get user progress
 * POST /api/progress — Update progress for a topic
 */

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Progress from '@/models/Progress';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const payload = authenticateRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');

    const query = { userId: payload.userId };
    if (subjectId) query.subjectId = subjectId;

    const progress = await Progress.find(query)
      .populate('topicId', 'title slug')
      .populate('subjectId', 'name slug');

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Progress GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch progress.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const payload = authenticateRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    await dbConnect();
    const { topicId, subjectId, notesRead, quizCompleted, quizScore, quizTotal, timeSpentMinutes } = await request.json();

    if (!topicId || !subjectId) {
      return NextResponse.json({ error: 'topicId and subjectId are required.' }, { status: 400 });
    }

    const update = { lastAccessed: new Date() };
    if (notesRead !== undefined) update.notesRead = notesRead;
    if (quizCompleted !== undefined) update.quizCompleted = quizCompleted;
    if (quizScore !== undefined) update.quizScore = quizScore;
    if (quizTotal !== undefined) update.quizTotal = quizTotal;
    if (timeSpentMinutes) update.$inc = { timeSpentMinutes };

    const progress = await Progress.findOneAndUpdate(
      { userId: payload.userId, topicId },
      { ...update, subjectId },
      { upsert: true, new: true }
    );

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Progress POST error:', error);
    return NextResponse.json({ error: 'Failed to update progress.' }, { status: 500 });
  }
}
