import { NextRequest, NextResponse } from 'next/server';
import { updateQuestion, deleteQuestion } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';

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

    const updated = await updateQuestion(id, {
      question_text: body.question_text?.trim(),
      option_a: body.option_a?.trim(),
      option_b: body.option_b?.trim(),
      option_c: body.option_c?.trim(),
      option_d: body.option_d?.trim(),
      correct_option: body.correct_option,
      explanation: body.explanation?.trim(),
    });

    if (!updated) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
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
    const success = await deleteQuestion(id);
    if (!success) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Question deleted successfully' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}