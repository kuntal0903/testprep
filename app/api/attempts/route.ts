import { NextRequest, NextResponse } from 'next/server';
import { getSubjectById, getQuestionsBySubject, saveAttempt, getAttempts, getLeaderboard } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';
import { QuestionReviewItem, OptionKey } from '@/types';

export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get('subject_id') || undefined;

  try {
    const attempts = await getAttempts(subjectId);
    return NextResponse.json(attempts);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch attempts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject_id, student_name, roll_no, answers, time_taken_seconds } = body;

    if (!subject_id) {
      return NextResponse.json({ error: 'subject_id is required' }, { status: 400 });
    }
    if (!student_name || !student_name.trim()) {
      return NextResponse.json({ error: 'Student name is required' }, { status: 400 });
    }

    const subject = await getSubjectById(subject_id);
    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    const questions = await getQuestionsBySubject(subject_id);
    if (questions.length === 0) {
      return NextResponse.json({ error: 'No questions found for this subject' }, { status: 400 });
    }

    // Build question map for instant lookup
    const qMap = new Map(questions.map((q) => [q.id, q]));
    const studentAnswersMap = new Map<string, OptionKey | null>();
    if (Array.isArray(answers)) {
      answers.forEach((ans: { question_id: string; selected_option: OptionKey | null }) => {
        studentAnswersMap.set(ans.question_id, ans.selected_option || null);
      });
    }

    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    let answeredCount = 0;
    let totalScore = 0;

    const reviewItems: QuestionReviewItem[] = questions.map((q) => {
      const selectedOption = studentAnswersMap.get(q.id) || null;
      let isCorrect = false;
      let marksAwarded = 0;

      if (!selectedOption) {
        unansweredCount++;
        marksAwarded = 0;
      } else {
        answeredCount++;
        if (selectedOption.toUpperCase() === q.correct_option.toUpperCase()) {
          isCorrect = true;
          correctCount++;
          marksAwarded = 1;
        } else {
          incorrectCount++;
          if (subject.negative_marking) {
            marksAwarded = -Number(subject.negative_mark_value || 0.25);
          } else {
            marksAwarded = 0;
          }
        }
      }

      totalScore += marksAwarded;

      return {
        question_id: q.id,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        selected_option: selectedOption,
        correct_option: q.correct_option,
        is_correct: isCorrect,
        explanation: q.explanation,
        marks_awarded: marksAwarded,
      };
    });

    // Score can be negative if negative marking is enabled, but typically clamped at 0 or allowed
    const finalScore = Math.max(0, Number(totalScore.toFixed(2)));
    const totalQuestions = questions.length;
    const percentage = totalQuestions > 0
      ? Math.max(0, Number(((finalScore / totalQuestions) * 100).toFixed(1)))
      : 0;
    const passed = percentage >= subject.passing_score;

    const attempt = await saveAttempt({
      subject_id: subject.id,
      subject_title: subject.title,
      student_name: student_name.trim(),
      roll_no: roll_no?.trim() || undefined,
      total_questions: totalQuestions,
      answered_count: answeredCount,
      correct_count: correctCount,
      incorrect_count: incorrectCount,
      unanswered_count: unansweredCount,
      score: finalScore,
      percentage: percentage,
      time_taken_seconds: Math.max(1, parseInt(time_taken_seconds, 10) || 1),
      passed: passed,
      answers: reviewItems,
    });

    // Compute live rank
    const leaderboard = await getLeaderboard(subject.id);
    const userRankEntry = leaderboard.find((entry) => entry.id === attempt.id);
    const rank = userRankEntry ? userRankEntry.rank : 1;

    return NextResponse.json({
      attempt: {
        ...attempt,
        rank,
      },
      rank,
      totalRankers: leaderboard.length,
      passing_score: subject.passing_score,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to submit exam attempt';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
