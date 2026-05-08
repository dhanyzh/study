import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function GET() {
  try {
    await dbConnect();
    const username = 'fezin';
    const user = await User.findOne({ username: new RegExp('^' + username + '$', 'i') });
    
    if (!user) {
      return NextResponse.json({ success: false, message: `User ${username} not found.` });
    }

    if (user.role === 'admin' || user.role === 'super_admin') {
      user.role = 'student';
      user.permissions = [];
      await user.save();
      return NextResponse.json({ success: true, message: `Successfully revoked admin rights from user: ${user.username}.` });
    } else {
      return NextResponse.json({ success: true, message: `User ${user.username} is already not an admin. Role: ${user.role}` });
    }
  } catch (error) {
    console.error('Error removing admin:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
