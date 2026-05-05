/**
 * GET /api/auth/me — Get current authenticated user from JWT
 * 
 * Supports both DB-backed and local auth mode.
 * Falls back to JWT payload when DB user is not found.
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

    // Try DB first
    try {
      await dbConnect();
      const user = await User.findById(payload.userId);
      if (user) {
        const userData = user.toJSON();
        // Ensure role from JWT is included (in case DB hasn't been updated yet)
        if (!userData.role && payload.role) {
          userData.role = payload.role;
        }
        return NextResponse.json({ user: userData });
      }
    } catch (dbError) {
      console.warn('DB unavailable for /api/auth/me, using JWT payload.');
    }

    // Fallback: construct user from JWT payload (local auth mode)
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
