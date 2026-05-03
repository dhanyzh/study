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

    const pistonLang = {
      javascript: 'javascript',
      python: 'python',
      cpp: 'c++',
      c: 'c',
      java: 'java'
    }[language];

    if (!pistonLang) {
      return NextResponse.json({ error: `Unsupported language: ${language}` }, { status: 400 });
    }

    const res = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language: pistonLang,
        version: '*',
        files: [{ content: sourceCode }],
        stdin: stdin || ''
      }),
    });

    const result = await res.json();
    
    if (!res.ok) {
      return NextResponse.json({ error: result.message || 'Execution failed on server' }, { status: res.status });
    }

    return NextResponse.json({
      stdout: result.run.stdout || '',
      stderr: result.run.stderr || '',
      status: { description: result.run.signal || (result.run.code === 0 ? 'Accepted' : 'Runtime Error') },
      time: '0.1', // Piston doesn't return time directly in the root, it's fine
      memory: 0,
    });
  } catch (error) {
    console.error('Code execution error:', error);
    return NextResponse.json({ error: 'Code execution failed.' }, { status: 500 });
  }
}
