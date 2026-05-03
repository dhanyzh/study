/**
 * POST /api/sessions — Log a study session
 */
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import StudySession from '@/models/StudySession';
import { authenticateRequest } from '@/lib/auth';

export async function POST(request) {
  try {
    const payload = authenticateRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    await dbConnect();
    const { subjectId, durationMinutes, sessionType } = await request.json();

    const session = await StudySession.create({
      userId: payload.userId,
      subjectId: subjectId || undefined,
      durationMinutes: durationMinutes || 0,
      sessionType: sessionType || 'free',
      endedAt: new Date(),
    });

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ error: 'Failed to log session.' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const payload = authenticateRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    await dbConnect();
    const sessions = await StudySession.find({ userId: payload.userId })
      .sort({ startedAt: -1 }).limit(50).populate('subjectId', 'name icon color');

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Sessions GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions.' }, { status: 500 });
  }
}
