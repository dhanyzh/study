/**
 * GET /api/exams?subjectId=xxx — List exams
 * POST /api/exams — Create an exam (admin)
 */

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Exam from '@/models/Exam';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');

    const query = {};
    if (subjectId) query.subjectId = subjectId;

    const exams = await Exam.find(query).populate('mcqs').sort({ createdAt: -1 });
    return NextResponse.json({ exams });
  } catch (error) {
    console.error('Exams GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch exams.' }, { status: 500 });
  }
}
