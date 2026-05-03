/**
 * GET /api/subjects — List all subjects
 */

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Subject from '@/models/Subject';

export async function GET() {
  try {
    await dbConnect();
    const subjects = await Subject.find({}).sort({ order: 1 });
    return NextResponse.json({ subjects });
  } catch (error) {
    console.error('Subjects error:', error);
    return NextResponse.json({ error: 'Failed to fetch subjects.' }, { status: 500 });
  }
}
