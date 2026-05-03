/**
 * GET /api/topics?chapterId=xxx — List topics for a chapter
 */

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Topic from '@/models/Topic';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get('chapterId');

    if (!chapterId) {
      return NextResponse.json({ error: 'chapterId is required.' }, { status: 400 });
    }

    const topics = await Topic.find({ chapterId }).sort({ order: 1 });
    return NextResponse.json({ topics });
  } catch (error) {
    console.error('Topics error:', error);
    return NextResponse.json({ error: 'Failed to fetch topics.' }, { status: 500 });
  }
}
