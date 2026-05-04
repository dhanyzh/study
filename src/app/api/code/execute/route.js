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

    const wandboxLang = {
      javascript: 'nodejs-20.17.0',
      python: 'cpython-3.14.0',
      cpp: 'gcc-head',
      c: 'gcc-head-c',
      java: 'openjdk-jdk-22+36'
    }[language];

    if (!wandboxLang) {
      return NextResponse.json({ error: `Unsupported language: ${language}` }, { status: 400 });
    }

    // Wandbox public API (completely free, no auth required)
    const res = await fetch('https://wandbox.org/api/compile.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        compiler: wandboxLang,
        code: sourceCode,
        stdin: stdin || ''
      }),
    });

    const result = await res.json();
    
    if (!res.ok) {
      return NextResponse.json({ error: result.message || 'Execution failed on server' }, { status: res.status });
    }

    // Wandbox returns status string '0' for success, '1' for failure
    const isError = result.status !== '0';

    return NextResponse.json({
      stdout: result.program_output || '',
      stderr: result.compiler_error || result.program_error || '',
      status: { description: isError ? 'Runtime Error / Compilation Error' : 'Accepted' },
      time: '0.1', 
      memory: 0,
    });
  } catch (error) {
    console.error('Code execution error:', error);
    return NextResponse.json({ error: 'Code execution failed.' }, { status: 500 });
  }
}
