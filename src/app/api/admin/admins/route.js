import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { requireSuperAdmin } from '@/lib/adminAuth';
import { hashPassword } from '@/lib/auth';

/**
 * GET /api/admin/admins — List all admin/super_admin users
 */
export async function GET(request) {
  const auth = requireSuperAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await dbConnect();
    const admins = await User.find({ 
      role: { $in: ['admin', 'super_admin'] } 
    }).sort({ createdAt: -1 });
    
    return NextResponse.json({ admins });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch admins.' }, { status: 500 });
  }
}

/**
 * POST /api/admin/admins — Create a new admin user
 */
export async function POST(request) {
  const auth = requireSuperAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { username, password, email, role, permissions, displayName } = await request.json();

    if (!username || !password || !role) {
      return NextResponse.json({ error: 'Username, password and role are required.' }, { status: 400 });
    }

    if (!['admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role for admin creation.' }, { status: 400 });
    }

    await dbConnect();

    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: 'Username already exists.' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const newAdmin = await User.create({
      username: username.toLowerCase(),
      email,
      passwordHash,
      role,
      permissions: permissions || [],
      displayName: displayName || username,
    });

    return NextResponse.json({ 
      admin: newAdmin, 
      message: 'Admin created successfully.' 
    });
  } catch (error) {
    console.error('Create Admin Error:', error);
    return NextResponse.json({ error: 'Failed to create admin.' }, { status: 500 });
  }
}
