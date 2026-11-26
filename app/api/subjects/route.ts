import { NextRequest, NextResponse } from 'next/server';
import { getSubjects, createSubject } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';

export async function GET() {
  try {
    const subjects = await getSubjects();
    return NextResponse.json(subjects);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ error: 'Subject title is required' }, { status: 400 });
    }

    const newSubject = await createSubject({
      title: body.title.trim(),
      description: body.description?.trim() || '',
      time_limit: Math.max(1, parseInt(body.time_limit, 10) || 15),
      negative_marking: Boolean(body.negative_marking),
      negative_mark_value: Math.max(0, parseFloat(body.negative_mark_value) || 0.25),
      passing_score: Math.min(100, Math.max(1, parseFloat(body.passing_score) || 60)),
    });

    return NextResponse.json(newSubject, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create subject';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
