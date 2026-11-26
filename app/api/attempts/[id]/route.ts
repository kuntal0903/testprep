import { NextRequest, NextResponse } from 'next/server';
import { deleteAttempt } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';

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
    const success = await deleteAttempt(id);
    if (!success) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Attempt deleted successfully' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete attempt' }, { status: 500 });
  }
}