/**
 * GET /api/auth/me — Get current authenticated user from JWT
 */

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const payload = authenticateRequest(request);
    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    await dbConnect();
    const user = await User.findById(payload.userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: user.toJSON() });
  } catch (error) {
    console.error('Auth/me error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user.' },
      { status: 500 }
    );
  }
}
