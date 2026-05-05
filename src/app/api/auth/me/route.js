/**
 * GET /api/auth/me — Get current authenticated user from JWT
 * 
 * Tries DB first. Falls back to JWT payload ONLY for local-auth-mode
 * users (IDs like user_xxx_123) when DB is unreachable.
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

    const isLocalAuthId = typeof payload.userId === 'string' && payload.userId.startsWith('user_');

    // Try DB
    try {
      await dbConnect();
      const user = await User.findById(payload.userId);

      if (user) {
        const userData = user.toJSON();
        // Ensure role is included
        if (!userData.role && payload.role) {
          userData.role = payload.role;
        }
        return NextResponse.json({ user: userData });
      }

      // DB connected but user not found
      if (!isLocalAuthId) {
        // Real ObjectId that doesn't exist in DB — token is stale
        return NextResponse.json(
          { error: 'User not found. Please log in again.' },
          { status: 401 }
        );
      }
    } catch (dbError) {
      console.warn('DB unavailable for /api/auth/me');
      // DB unreachable — only allow fallback for local auth IDs
      if (!isLocalAuthId) {
        return NextResponse.json(
          { error: 'Database unavailable. Please try again.' },
          { status: 503 }
        );
      }
    }

    // Fallback ONLY for local-auth-mode users (user_xxx_123)
    return NextResponse.json({
      user: {
        _id: payload.userId,
        username: payload.username,
        displayName: payload.username.charAt(0).toUpperCase() + payload.username.slice(1),
        role: payload.role || 'student',
      },
    });
  } catch (error) {
    console.error('Auth/me error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user.' },
      { status: 500 }
    );
  }
}
