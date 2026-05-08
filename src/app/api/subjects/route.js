/**
 * GET /api/subjects — List all subjects
 */

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Subject from '@/models/Subject';
import { sanitizeObject } from '@/lib/sanitizer';

export async function GET() {
  try {
    await dbConnect();
    const rawSubjects = await Subject.find({}).sort({ order: 1 }).lean();
    const subjects = sanitizeObject(rawSubjects);
    return NextResponse.json({ subjects });
  } catch (error) {
    console.error('Subjects error:', error);
    return NextResponse.json({ error: 'Failed to fetch subjects.' }, { status: 500 });
  }
}
