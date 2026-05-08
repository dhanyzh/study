/**
 * GET /api/topics?chapterId=xxx — List topics for a chapter
 */

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Topic from '@/models/Topic';
import { sanitizeObject } from '@/lib/sanitizer';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get('chapterId');
    const subjectId = searchParams.get('subjectId');

    if (!chapterId && !subjectId) {
      return NextResponse.json({ error: 'chapterId or subjectId is required.' }, { status: 400 });
    }

    let query = {};
    if (chapterId) query.chapterId = chapterId;
    else if (subjectId) query.subjectId = subjectId;

    const rawTopics = await Topic.find(query).sort({ order: 1 }).lean();
    const topics = sanitizeObject(rawTopics);
    return NextResponse.json({ topics });
  } catch (error) {
    console.error('Topics error:', error);
    return NextResponse.json({ error: 'Failed to fetch topics.' }, { status: 500 });
  }
}
