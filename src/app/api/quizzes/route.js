/**
 * GET /api/quizzes?topicId=xxx&subjectId=xxx — Get quizzes
 */

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Quiz from '@/models/Quiz';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get('topicId');
    const subjectId = searchParams.get('subjectId');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query = {};
    if (topicId) query.topicId = topicId;
    if (subjectId) query.subjectId = subjectId;

    const quizzes = await Quiz.find(query).limit(limit);
    return NextResponse.json({ quizzes });
  } catch (error) {
    console.error('Quizzes error:', error);
    return NextResponse.json({ error: 'Failed to fetch quizzes.' }, { status: 500 });
  }
}
