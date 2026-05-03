/**
 * GET /api/notes?topicId=xxx — Get notes for a topic
 * GET /api/notes?subjectId=xxx — Get notes across a subject (via Topic.subjectId)
 * PUT /api/notes — Update or create a note
 */

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Note from '@/models/Note';
import Topic from '@/models/Topic';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get('topicId');
    const subjectId = searchParams.get('subjectId');
    const limit = Math.max(1, Math.min(200, parseInt(searchParams.get('limit') || '200', 10)));

    if (!topicId && !subjectId) {
      return NextResponse.json({ error: 'topicId or subjectId is required.' }, { status: 400 });
    }

    let query = {};
    if (topicId) {
      query.topicId = topicId;
    } else if (subjectId) {
      const topics = await Topic.find({ subjectId }).select('_id').limit(5000);
      const topicIds = topics.map((t) => t._id);
      query.topicId = { $in: topicIds };
    }

    // Get system notes + user notes (user notes require auth but can still be returned for topicId).
    // This endpoint is currently used for public/system notes too, so keep it permissive.
    const notes = await Note.find(query)
      .populate('topicId', 'title slug chapterId subjectId')
      .sort({ source: 1, createdAt: -1 })
      .limit(limit);
    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Notes GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch notes.' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const payload = authenticateRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    await dbConnect();
    const { topicId, content } = await request.json();

    if (!topicId || !content) {
      return NextResponse.json({ error: 'topicId and content are required.' }, { status: 400 });
    }

    // Upsert user note for this topic
    const note = await Note.findOneAndUpdate(
      { topicId, userId: payload.userId, source: 'user' },
      { content, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    return NextResponse.json({ note, message: 'Note saved!' });
  } catch (error) {
    console.error('Notes PUT error:', error);
    return NextResponse.json({ error: 'Failed to save note.' }, { status: 500 });
  }
}
