import { NextRequest, NextResponse } from 'next/server';
import { getQuestionsBySubject, getSubjects, exportAllData } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get('subject_id');

  try {
    if (subjectId && subjectId !== 'all') {
      const questions = await getQuestionsBySubject(subjectId);
      const subjects = await getSubjects();
      const subject = subjects.find((s) => s.id === subjectId);

      return new NextResponse(
        JSON.stringify(
          {
            subject: subject || null,
            exported_at: new Date().toISOString(),
            questions: questions.map((q) => ({
              question_text: q.question_text,
              option_a: q.option_a,
              option_b: q.option_b,
              option_c: q.option_c,
              option_d: q.option_d,
              correct_option: q.correct_option,
              explanation: q.explanation,
            })),
          },
          null,
          2
        ),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="question_bank_${subjectId}.json"`,
          },
        }
      );
    }

    const fullExport = await exportAllData();
    return new NextResponse(JSON.stringify(fullExport, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="examportal_backup.json"',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
