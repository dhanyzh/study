/**
 * GET /api/admin/topics?chapterId=xxx — List topics for a chapter
 * POST /api/admin/topics — Create a topic + optional note
 * PATCH /api/admin/topics — Update a topic
 * DELETE /api/admin/topics — Delete a topic and its notes/quizzes
 */

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';
import Topic from '@/models/Topic';
import Note from '@/models/Note';
import Quiz from '@/models/Quiz';
import Chapter from '@/models/Chapter';

export async function GET(request) {
  const auth = requireAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get('chapterId');

    await dbConnect();
    const query = chapterId ? { chapterId } : {};
    const topics = await Topic.find(query).sort({ order: 1 }).lean();

    const enriched = await Promise.all(topics.map(async (t) => {
      const noteCount = await Note.countDocuments({ topicId: t._id });
      const quizCount = await Quiz.countDocuments({ topicId: t._id });
      return { ...t, noteCount, quizCount };
    }));

    return NextResponse.json({ topics: enriched });
  } catch (error) {
    console.error('Admin topics GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch topics.' }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = requireAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { chapterId, title, slug, order, videoUrl, noteContent } = await request.json();
    if (!chapterId || !title || !slug) {
      return NextResponse.json({ error: 'chapterId, title, and slug are required.' }, { status: 400 });
    }

    await dbConnect();

    // Get subjectId from chapter
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found.' }, { status: 404 });
    }

    const topic = await Topic.create({
      chapterId,
      subjectId: chapter.subjectId,
      title,
      slug: slug.toLowerCase().replace(/\s+/g, '-'),
      order: order || 0,
      videoUrl: videoUrl || '',
    });

    // Create system note if content provided
    if (noteContent) {
      await Note.create({
        topicId: topic._id,
        content: noteContent,
        source: 'system',
      });
    }

    return NextResponse.json({ topic, message: 'Topic created.' }, { status: 201 });
  } catch (error) {
    console.error('Admin topics POST error:', error);
    return NextResponse.json({ error: 'Failed to create topic.' }, { status: 500 });
  }
}

export async function PATCH(request) {
  const auth = requireAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { topicId, noteContent, ...updates } = await request.json();
    if (!topicId) {
      return NextResponse.json({ error: 'topicId is required.' }, { status: 400 });
    }

    await dbConnect();
    const topic = await Topic.findByIdAndUpdate(topicId, updates, { new: true });
    if (!topic) {
      return NextResponse.json({ error: 'Topic not found.' }, { status: 404 });
    }

    // Update/create system note if content provided
    if (noteContent !== undefined) {
      await Note.findOneAndUpdate(
        { topicId, source: 'system', userId: null },
        { content: noteContent, updatedAt: new Date() },
        { upsert: true, new: true }
      );
    }

    return NextResponse.json({ topic, message: 'Topic updated.' });
  } catch (error) {
    console.error('Admin topics PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update topic.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const auth = requireAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get('topicId');
    if (!topicId) {
      return NextResponse.json({ error: 'topicId is required.' }, { status: 400 });
    }

    await dbConnect();
    await Promise.all([
      Note.deleteMany({ topicId }),
      Quiz.deleteMany({ topicId }),
      Topic.findByIdAndDelete(topicId),
    ]);

    return NextResponse.json({ message: 'Topic deleted.' });
  } catch (error) {
    console.error('Admin topics DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete topic.' }, { status: 500 });
  }
}
