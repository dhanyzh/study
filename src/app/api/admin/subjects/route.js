/**
 * GET /api/admin/subjects — List all subjects with chapter/topic counts
 * POST /api/admin/subjects — Create a new subject
 * PATCH /api/admin/subjects — Update a subject
 * DELETE /api/admin/subjects — Delete a subject and its children
 */

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';
import Subject from '@/models/Subject';
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
    await dbConnect();
    const subjects = await Subject.find({}).sort({ order: 1 }).lean();

    // Enrich with counts
    const enriched = await Promise.all(subjects.map(async (s) => {
      const chapterCount = await Chapter.countDocuments({ subjectId: s._id });
      const topicCount = await Topic.countDocuments({ subjectId: s._id });
      const quizCount = await Quiz.countDocuments({ subjectId: s._id });
      return { ...s, chapterCount, topicCount, quizCount };
    }));

    return NextResponse.json({ subjects: enriched });
  } catch (error) {
    console.error('Admin subjects GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch subjects.' }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = requireAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { name, slug, icon, color, description, order } = await request.json();
    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required.' }, { status: 400 });
    }

    await dbConnect();
    const subject = await Subject.create({
      name,
      slug: slug.toLowerCase().replace(/\s+/g, '-'),
      icon: icon || '📚',
      color: color || '#6C63FF',
      description: description || '',
      order: order || 0,
    });

    return NextResponse.json({ subject, message: 'Subject created.' }, { status: 201 });
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Subject with this name/slug already exists.' }, { status: 409 });
    }
    console.error('Admin subjects POST error:', error);
    return NextResponse.json({ error: 'Failed to create subject.' }, { status: 500 });
  }
}

export async function PATCH(request) {
  const auth = requireAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { subjectId, ...updates } = await request.json();
    if (!subjectId) {
      return NextResponse.json({ error: 'subjectId is required.' }, { status: 400 });
    }

    await dbConnect();
    const subject = await Subject.findByIdAndUpdate(subjectId, updates, { new: true });
    if (!subject) {
      return NextResponse.json({ error: 'Subject not found.' }, { status: 404 });
    }

    return NextResponse.json({ subject, message: 'Subject updated.' });
  } catch (error) {
    console.error('Admin subjects PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update subject.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const auth = requireAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');
    if (!subjectId) {
      return NextResponse.json({ error: 'subjectId is required.' }, { status: 400 });
    }

    await dbConnect();

    // Get all topics for this subject to clean up notes
    const topics = await Topic.find({ subjectId }).select('_id');
    const topicIds = topics.map(t => t._id);

    // Cascade delete
    await Promise.all([
      Note.deleteMany({ topicId: { $in: topicIds } }),
      Quiz.deleteMany({ subjectId }),
      Topic.deleteMany({ subjectId }),
      Chapter.deleteMany({ subjectId }),
      Subject.findByIdAndDelete(subjectId),
    ]);

    return NextResponse.json({ message: 'Subject and all related data deleted.' });
  } catch (error) {
    console.error('Admin subjects DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete subject.' }, { status: 500 });
  }
}
