/**
 * POST /api/code/execute — Proxy to Judge0 API for code execution
 */

import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { LANGUAGE_IDS } from '@/lib/constants';

export async function POST(request) {
  try {
    const payload = authenticateRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { sourceCode, language, stdin } = await request.json();
    if (!sourceCode || !language) {
      return NextResponse.json({ error: 'sourceCode and language are required.' }, { status: 400 });
    }

    const judge0Lang = {
      javascript: 63,
      python: 71,
      cpp: 54,
      c: 50,
      java: 62
    }[language];

    if (!judge0Lang) {
      return NextResponse.json({ error: `Unsupported language: ${language}` }, { status: 400 });
    }

    const apiKey = process.env.JUDGE0_API_KEY;
    if (!apiKey || apiKey === 'your-judge0-rapidapi-key-here') {
      return NextResponse.json({ 
        error: 'Please configure your JUDGE0_API_KEY in .env.local to execute code.' 
      }, { status: 500 });
    }

    const res = await fetch(`${process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com'}/submissions?base64_encoded=false&wait=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
      },
      body: JSON.stringify({
        language_id: judge0Lang,
        source_code: sourceCode,
        stdin: stdin || ''
      }),
    });

    const result = await res.json();
    
    if (!res.ok) {
      return NextResponse.json({ error: result.message || 'Execution failed on server' }, { status: res.status });
    }

    return NextResponse.json({
      stdout: result.stdout || '',
      stderr: result.stderr || result.compile_output || '',
      status: { description: result.status?.description || 'Unknown' },
      time: result.time,
      memory: result.memory,
    });
  } catch (error) {
    console.error('Code execution error:', error);
    return NextResponse.json({ error: 'Code execution failed.' }, { status: 500 });
  }
}
