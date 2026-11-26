import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { getSubjects, getAdminStats } from '@/lib/db';
import { 
  Clock, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Trophy, 
  Sparkles, 
  BookOpen, 
  ShieldCheck,
  TrendingUp,
  Percent
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [subjects, stats] = await Promise.all([
    getSubjects(),
    getAdminStats(),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1">
        {/* Academic Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-indigo-900 via-slate-900 to-slate-900 text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8 shadow-md">
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          <div className="relative max-w-5xl mx-auto text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs sm:text-sm font-semibold backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>TESTPREP Assessment • Are You Ready?</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Do You Want to Test Your Knowledge, <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-indigo-200">
                Or Are You the Next Topper?
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-slate-300 text-sm sm:text-base md:text-lg leading-relaxed">
              Step into the arena. Test your intellect against strict countdown timers, analyze instant answer keys, and see if you have what it takes to dethrone the current rankers on the live leaderboard.
            </p>

            {/* Quick action buttons */}
            <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#subjects-section"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
              >
                <BookOpen className="w-4 h-4" />
                Browse Available Exams
              </a>
              <Link
                href="/leaderboard"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm transition-all hover:text-white"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                Live Leaderboard
              </Link>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="relative max-w-4xl mx-auto mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <p className="text-2xl sm:text-3xl font-extrabold text-white">{stats.total_subjects}</p>
              <p className="text-xs text-slate-400 mt-0.5">Active Subjects</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <p className="text-2xl sm:text-3xl font-extrabold text-indigo-300">{stats.total_questions}</p>
              <p className="text-xs text-slate-400 mt-0.5">Curated MCQs</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-300">{stats.total_attempts}</p>
              <p className="text-xs text-slate-400 mt-0.5">Completed Tests</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-300">{stats.average_score}%</p>
              <p className="text-xs text-slate-400 mt-0.5">Average Score</p>
            </div>
          </div>
        </section>

        {/* Subjects Grid Section */}
        <section id="subjects-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200 mb-2">
                Challenge Your Limits
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Are You Ready to Test Your Knowledge, or Are You the Next Topper?
              </h2>
              <p className="text-slate-700 text-sm mt-1">
                Select your subject, beat the countdown timer, and claim your place among the top performers.
              </p>
            </div>

            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-800 transition-colors"
            >
              <span>View Overall Rankings</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {subjects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center max-w-lg mx-auto">
              <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900">No Subjects Published Yet</h3>
              <p className="text-slate-700 text-sm mt-1 mb-5">
                The administrator has not published any test subjects yet. Log in to the Admin Dashboard to create your first subject.
              </p>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-all shadow-sm"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-700" />
                Go to Admin Dashboard
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {subjects.map((subject) => {
                const questionCount = subject.question_count || 0;
                const hasQuestions = questionCount > 0;

                return (
                  <div
                    key={subject.id}
                    className="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
                  >
                    {/* Subject Header */}
                    <div className="p-6 pb-4 flex-1">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <BookOpen className="w-3.5 h-3.5" />
                          Subject Code: {subject.id}
                        </span>

                        {subject.negative_marking ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertCircle className="w-3 h-3" />
                            -{subject.negative_mark_value} Negative Mark
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            No Negative Mark
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                        {subject.title}
                      </h3>

                      <p className="text-slate-700 text-sm mt-2 line-clamp-2 leading-relaxed">
                        {subject.description || 'Comprehensive evaluation covering theoretical and applied knowledge.'}
                      </p>

                      {/* Criteria Badges */}
                      <div className="mt-5 grid grid-cols-3 gap-2 py-3 px-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <HelpCircle className="w-4 h-4 text-indigo-700 shrink-0" />
                          <span>{questionCount} {questionCount === 1 ? 'MCQ' : 'MCQs'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>{subject.time_limit} Mins</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Percent className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Pass: {subject.passing_score}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-3">
                      <Link
                        href={`/leaderboard?subject=${subject.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-700 transition-colors py-2"
                      >
                        <Trophy className="w-3.5 h-3.5 text-amber-700" />
                        Leaderboard
                      </Link>

                      {hasQuestions ? (
                        <Link
                          href={`/exam/${subject.id}`}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all hover:translate-x-0.5"
                        >
                          <span>Start Exam</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-semibold cursor-not-allowed"
                        >
                          Questions Pending
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Informational Academic Highlights */}
        <section className="bg-white border-t border-slate-200 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Automated Timekeeper</h4>
                <p className="text-slate-700 text-xs mt-1 leading-relaxed">
                  Real-time countdown timer ensures fair testing. Automatic submission guarantees that no test can exceed its allocated duration.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Instant Review & Explanations</h4>
                <p className="text-slate-700 text-xs mt-1 leading-relaxed">
                  Immediately after submission, review correct answers alongside verified administrator explanations for every single MCQ.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Tie-Breaking Live Rankings</h4>
                <p className="text-slate-700 text-xs mt-1 leading-relaxed">
                  Rankings prioritize highest overall score and percentage, using the fastest completion time as an objective tie-breaker.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
