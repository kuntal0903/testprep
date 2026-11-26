import { NextRequest, NextResponse } from 'next/server';
import { getAdminStats } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  try {
    const stats = await getAdminStats();
    return NextResponse.json(stats);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 });
  }
}