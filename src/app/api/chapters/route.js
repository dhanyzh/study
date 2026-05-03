/**
 * GET /api/chapters?subjectId=xxx — List chapters for a subject
 */

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Chapter from '@/models/Chapter';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');

    if (!subjectId) {
      return NextResponse.json({ error: 'subjectId is required.' }, { status: 400 });
    }

    const chapters = await Chapter.find({ subjectId }).sort({ order: 1 });
    return NextResponse.json({ chapters });
  } catch (error) {
    console.error('Chapters error:', error);
    return NextResponse.json({ error: 'Failed to fetch chapters.' }, { status: 500 });
  }
}
