/**
 * GET /api/admin/users — List all users
 * DELETE /api/admin/users — Delete a user
 * PATCH /api/admin/users — Update user role
 */

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requirePermission } from '@/lib/adminAuth';
import User from '@/models/User';

export async function GET(request) {
  const auth = requirePermission(request, 'manage_users');
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await dbConnect();
    // Fetch all users who are NOT admins or super_admins
    const users = await User.find({ 
      role: { $nin: ['admin', 'super_admin'] } 
    }).sort({ createdAt: -1 });
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Admin users GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch users.' }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = requirePermission(request, 'manage_users');
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { username, password, email, role, displayName } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 });
    }

    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: 'Username is already taken.' }, { status: 400 });
    }

    // Dynamic import to avoid circular dependencies if any, but regular import works since we don't have cycles
    const { hashPassword } = await import('@/lib/auth');
    const passwordHash = await hashPassword(password);

    const newUser = await User.create({
      username: username.toLowerCase(),
      passwordHash,
      email: email || undefined,
      role: role || 'student',
      displayName: displayName || username
    });

    const userObj = newUser.toJSON();

    return NextResponse.json({ user: userObj, message: 'User created successfully.' });
  } catch (error) {
    console.error('Admin users POST error:', error);
    return NextResponse.json({ error: 'Failed to create user.', details: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  const auth = requirePermission(request, 'manage_users');
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { userId, role } = await request.json();
    if (!userId || !['student', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Valid userId and role required.' }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findByIdAndUpdate(userId, { role }, { new: true }).select('-passwordHash');
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({ user, message: 'Role updated successfully.' });
  } catch (error) {
    console.error('Admin users PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update user.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const auth = requirePermission(request, 'manage_users');
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId is required.' }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Admin users DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete user.' }, { status: 500 });
  }
}
