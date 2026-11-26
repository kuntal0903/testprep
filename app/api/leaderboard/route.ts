import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard, resetSubjectLeaderboard } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get('subject_id') || undefined;

  try {
    const leaderboard = await getLeaderboard(subjectId);
    return NextResponse.json(leaderboard);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const isAdmin = await verifyAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get('subject_id') || 'all';

  try {
    await resetSubjectLeaderboard(subjectId);
    return NextResponse.json({
      success: true,
      message: subjectId === 'all' ? 'All leaderboard entries reset' : `Leaderboard reset for subject`,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to reset leaderboard' }, { status: 500 });
  }
}
