import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { getSubjectById, getQuestionsBySubject } from '@/lib/db';
import { ExamRunner } from '@/components/ExamRunner';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { PublicQuestion } from '@/types';

export const dynamic = 'force-dynamic';

export default async function ExamPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const subject = await getSubjectById(id);

  if (!subject) {
    notFound();
  }

  const rawQuestions = await getQuestionsBySubject(id);

  const sanitizedQuestions: PublicQuestion[] = rawQuestions.map((q) => ({
    id: q.id,
    subject_id: q.subject_id,
    question_text: q.question_text,
    option_a: q.option_a,
    option_b: q.option_b,
    option_c: q.option_c,
    option_d: q.option_d,
  }));

  if (sanitizedQuestions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
            <HelpCircle className="w-12 h-12 text-slate-400 mx-auto" />
            <h1 className="text-xl font-bold text-slate-900">No Questions Published</h1>
            <p className="text-slate-700 text-sm">
              The administrator has not yet added any questions for &quot;{subject.title}&quot;. Please check back soon.
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Return to Subjects Lobby
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1">
        <ExamRunner subject={subject} questions={sanitizedQuestions} />
      </main>
      <Footer />
    </div>
  );
}