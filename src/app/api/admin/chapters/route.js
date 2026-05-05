/**
 * GET /api/admin/chapters?subjectId=xxx — List chapters for a subject
 * POST /api/admin/chapters — Create a chapter
 * PATCH /api/admin/chapters — Update a chapter
 * DELETE /api/admin/chapters — Delete a chapter and its topics/notes
 */

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';
import Chapter from '@/models/Chapter';
import Topic from '@/models/Topic';
import Note from '@/models/Note';
import Quiz from '@/models/Quiz';

export async function GET(request) {
  const auth = requireAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');

    await dbConnect();
    const query = subjectId ? { subjectId } : {};
    const chapters = await Chapter.find(query).sort({ order: 1 }).lean();

    const enriched = await Promise.all(chapters.map(async (c) => {
      const topicCount = await Topic.countDocuments({ chapterId: c._id });
      return { ...c, topicCount };
    }));

    return NextResponse.json({ chapters: enriched });
  } catch (error) {
    console.error('Admin chapters GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch chapters.' }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = requireAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { subjectId, title, slug, order, description } = await request.json();
    if (!subjectId || !title || !slug) {
      return NextResponse.json({ error: 'subjectId, title, and slug are required.' }, { status: 400 });
    }

    await dbConnect();
    const chapter = await Chapter.create({
      subjectId,
      title,
      slug: slug.toLowerCase().replace(/\s+/g, '-'),
      order: order || 0,
      description: description || '',
    });

    return NextResponse.json({ chapter, message: 'Chapter created.' }, { status: 201 });
  } catch (error) {
    console.error('Admin chapters POST error:', error);
    return NextResponse.json({ error: 'Failed to create chapter.' }, { status: 500 });
  }
}

export async function PATCH(request) {
  const auth = requireAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { chapterId, ...updates } = await request.json();
    if (!chapterId) {
      return NextResponse.json({ error: 'chapterId is required.' }, { status: 400 });
    }

    await dbConnect();
    const chapter = await Chapter.findByIdAndUpdate(chapterId, updates, { new: true });
    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found.' }, { status: 404 });
    }

    return NextResponse.json({ chapter, message: 'Chapter updated.' });
  } catch (error) {
    console.error('Admin chapters PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update chapter.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const auth = requireAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get('chapterId');
    if (!chapterId) {
      return NextResponse.json({ error: 'chapterId is required.' }, { status: 400 });
    }

    await dbConnect();
    const topics = await Topic.find({ chapterId }).select('_id');
    const topicIds = topics.map(t => t._id);

    await Promise.all([
      Note.deleteMany({ topicId: { $in: topicIds } }),
      Quiz.deleteMany({ topicId: { $in: topicIds } }),
      Topic.deleteMany({ chapterId }),
      Chapter.findByIdAndDelete(chapterId),
    ]);

    return NextResponse.json({ message: 'Chapter deleted.' });
  } catch (error) {
    console.error('Admin chapters DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete chapter.' }, { status: 500 });
  }
}
