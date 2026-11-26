import { NextRequest, NextResponse } from 'next/server';
import { getQuestionsBySubject, createQuestion } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get('subject_id');

  if (!subjectId) {
    return NextResponse.json({ error: 'subject_id parameter is required' }, { status: 400 });
  }

  try {
    const questions = await getQuestionsBySubject(subjectId);
    return NextResponse.json(questions);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body.subject_id) {
      return NextResponse.json({ error: 'subject_id is required' }, { status: 400 });
    }
    if (!body.question_text?.trim()) {
      return NextResponse.json({ error: 'Question text is required' }, { status: 400 });
    }
    if (!body.option_a?.trim() || !body.option_b?.trim() || !body.option_c?.trim() || !body.option_d?.trim()) {
      return NextResponse.json({ error: 'All 4 options (A, B, C, D) are required' }, { status: 400 });
    }
    if (!['A', 'B', 'C', 'D'].includes(body.correct_option)) {
      return NextResponse.json({ error: 'Valid correct_option (A, B, C, or D) is required' }, { status: 400 });
    }

    const newQuestion = await createQuestion({
      subject_id: body.subject_id,
      question_text: body.question_text.trim(),
      option_a: body.option_a.trim(),
      option_b: body.option_b.trim(),
      option_c: body.option_c.trim(),
      option_d: body.option_d.trim(),
      correct_option: body.correct_option,
      explanation: body.explanation?.trim() || '',
    });

    return NextResponse.json(newQuestion, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
  }
}
