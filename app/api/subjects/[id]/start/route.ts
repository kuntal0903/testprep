import { NextRequest, NextResponse } from 'next/server';
import { getSubjectById, getQuestionsBySubject } from '@/lib/db';
import { PublicQuestion } from '@/types';

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

    const questions = await getQuestionsBySubject(id);
    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'No questions have been published for this subject yet.' },
        { status: 400 }
      );
    }

    const sanitizedQuestions: PublicQuestion[] = questions.map((q) => ({
      id: q.id,
      subject_id: q.subject_id,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
    }));

    return NextResponse.json({
      subject: {
        id: subject.id,
        title: subject.title,
        description: subject.description,
        time_limit: subject.time_limit,
        negative_marking: subject.negative_marking,
        negative_mark_value: subject.negative_mark_value,
        passing_score: subject.passing_score,
        total_questions: sanitizedQuestions.length,
      },
      questions: sanitizedQuestions,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to start exam' }, { status: 500 });
  }
}