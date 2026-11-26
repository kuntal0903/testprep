import { NextRequest, NextResponse } from 'next/server';
import { getSubjectById, updateSubject, deleteSubject } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';

export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const subject = await getSubjectById(id);
    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }
    return NextResponse.json(subject);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch subject' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const isAdmin = await verifyAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  try {
    const { id } = await props.params;
    const body = await request.json();

    const updated = await updateSubject(id, {
      title: body.title?.trim(),
      description: body.description?.trim(),
      time_limit: body.time_limit ? Math.max(1, parseInt(body.time_limit, 10)) : undefined,
      negative_marking: body.negative_marking !== undefined ? Boolean(body.negative_marking) : undefined,
      negative_mark_value: body.negative_mark_value !== undefined ? Math.max(0, parseFloat(body.negative_mark_value)) : undefined,
      passing_score: body.passing_score !== undefined ? Math.min(100, Math.max(1, parseFloat(body.passing_score))) : undefined,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Failed to update subject' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const isAdmin = await verifyAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  try {
    const { id } = await props.params;
    const success = await deleteSubject(id);
    if (!success) {
      return NextResponse.json({ error: 'Subject not found or cannot be deleted' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Subject deleted successfully' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete subject' }, { status: 500 });
  }
}