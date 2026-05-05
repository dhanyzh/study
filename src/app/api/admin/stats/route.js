/**
 * GET /api/admin/stats — Admin dashboard statistics
 */

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';
import User from '@/models/User';
import Subject from '@/models/Subject';
import Chapter from '@/models/Chapter';
import Topic from '@/models/Topic';
import Quiz from '@/models/Quiz';
import Note from '@/models/Note';

export async function GET(request) {
  const auth = requireAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await dbConnect();

    const [totalUsers, totalSubjects, totalChapters, totalTopics, totalQuizzes, totalNotes] = await Promise.all([
      User.countDocuments({}),
      Subject.countDocuments({}),
      Chapter.countDocuments({}),
      Topic.countDocuments({}),
      Quiz.countDocuments({}),
      Note.countDocuments({}),
    ]);

    // Active users (logged in within last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activeUsers = await User.countDocuments({ lastLogin: { $gte: sevenDaysAgo } });

    // Recent users
    const recentUsers = await User.find({})
      .sort({ lastLogin: -1 })
      .limit(5)
      .select('username displayName lastLogin role');

    return NextResponse.json({
      stats: {
        totalUsers,
        totalSubjects,
        totalChapters,
        totalTopics,
        totalQuizzes,
        totalNotes,
        activeUsers,
      },
      recentUsers,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats.' }, { status: 500 });
  }
}
