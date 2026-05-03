/**
 * POST /api/ai/evaluate — AI evaluation for descriptive answers
 */

import { NextResponse } from 'next/server';
import { evaluateAnswer } from '@/lib/ai';
import { authenticateRequest } from '@/lib/auth';

export async function POST(request) {
  try {
    const payload = authenticateRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { question, answer, maxMarks } = await request.json();

    if (!question || !answer) {
      return NextResponse.json({ error: 'Question and answer are required.' }, { status: 400 });
    }

    const evaluation = await evaluateAnswer(question, answer, maxMarks || 5);

    return NextResponse.json({ evaluation });
  } catch (error) {
    console.error('AI evaluate error:', error);
    return NextResponse.json({ error: 'Evaluation failed.' }, { status: 500 });
  }
}
