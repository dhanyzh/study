/**
 * POST /api/ai/chat — AI assistant chat endpoint
 * 
 * Sends user message to Gemini with topic context for context-aware responses.
 */

import { NextResponse } from 'next/server';
import { chatWithAI } from '@/lib/ai';
import { authenticateRequest } from '@/lib/auth';

export async function POST(request) {
  console.log('[AI Chat] Received request...');
  try {
    const payload = authenticateRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { message, context, history } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    const response = await chatWithAI(message, context || {}, history || []);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json({ error: 'AI chat failed.' }, { status: 500 });
  }
}
