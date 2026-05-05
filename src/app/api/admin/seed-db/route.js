import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { seed } from '../../../../../scripts/seed.js';

export async function POST(request) {
  const auth = requireAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const result = await seed();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Seed error via API:', error);
    return NextResponse.json(
      { error: 'Database seeding failed.', details: error.message },
      { status: 500 }
    );
  }
}
