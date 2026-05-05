/**
 * GET /api/admin/quizzes — List quizzes with filters
 * POST /api/admin/quizzes — Create a quiz
 * PATCH /api/admin/quizzes — Update a quiz
 * DELETE /api/admin/quizzes — Delete a quiz
 */

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';
import Quiz from '@/models/Quiz';

export async function GET(request) {
  const auth = requireAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');
    const topicId = searchParams.get('topicId');
    const limit = parseInt(searchParams.get('limit') || '100');

    await dbConnect();
    const query = {};
    if (subjectId) query.subjectId = subjectId;
    if (topicId) query.topicId = topicId;

    const quizzes = await Quiz.find(query).sort({ createdAt: -1 }).limit(limit).lean();
    const total = await Quiz.countDocuments(query);

    return NextResponse.json({ quizzes, total });
  } catch (error) {
    console.error('Admin quizzes GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch quizzes.' }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = requireAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { subjectId, topicId, question, options, correctAnswer, explanation, difficulty } = await request.json();
    
    if (!subjectId || !question || !options || options.length < 2 || correctAnswer === undefined) {
      return NextResponse.json({ error: 'subjectId, question, options (min 2), and correctAnswer are required.' }, { status: 400 });
    }

    await dbConnect();
    const quiz = await Quiz.create({
      subjectId,
      topicId: topicId || null,
      question,
      options,
      correctAnswer,
      explanation: explanation || '',
      difficulty: difficulty || 'medium',
      source: 'system',
    });

    return NextResponse.json({ quiz, message: 'Quiz created.' }, { status: 201 });
  } catch (error) {
    console.error('Admin quizzes POST error:', error);
    return NextResponse.json({ error: 'Failed to create quiz.' }, { status: 500 });
  }
}

export async function PATCH(request) {
  const auth = requireAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { quizId, ...updates } = await request.json();
    if (!quizId) {
      return NextResponse.json({ error: 'quizId is required.' }, { status: 400 });
    }

    await dbConnect();
    const quiz = await Quiz.findByIdAndUpdate(quizId, updates, { new: true });
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found.' }, { status: 404 });
    }

    return NextResponse.json({ quiz, message: 'Quiz updated.' });
  } catch (error) {
    console.error('Admin quizzes PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update quiz.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const auth = requireAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get('quizId');
    if (!quizId) {
      return NextResponse.json({ error: 'quizId is required.' }, { status: 400 });
    }

    await dbConnect();
    const quiz = await Quiz.findByIdAndDelete(quizId);
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Quiz deleted.' });
  } catch (error) {
    console.error('Admin quizzes DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete quiz.' }, { status: 500 });
  }
}
