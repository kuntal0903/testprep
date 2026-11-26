'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { 
  Subject, 
  PublicQuestion, 
  OptionKey, 
  Attempt, 
  QuestionReviewItem 
} from '@/types';
import { FormattedText } from '@/components/FormattedText';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Bookmark, 
  BookmarkCheck, 
  AlertTriangle, 
  ArrowLeft, 
  ArrowRight, 
  RotateCcw, 
  Send, 
  Trophy, 
  ShieldCheck, 
  Percent, 
  Award, 
  Sparkles,
  HelpCircle,
  Check,
  ChevronRight,
  User,
  Hash
} from 'lucide-react';

interface ExamRunnerProps {
  subject: Subject;
  questions: PublicQuestion[];
}

type ExamPhase = 'instructions' | 'in_progress' | 'submitting' | 'results';

export function ExamRunner({ subject, questions }: ExamRunnerProps) {
  const router = useRouter();

  // Phase & Form State
  const [phase, setPhase] = useState<ExamPhase>('instructions');
  const [studentName, setStudentName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [rulesAgreed, setRulesAgreed] = useState(false);
  const [nameError, setNameError] = useState('');

  // Exam Progress State
  const [currentIndex, setCurrentIndex] = useState(0);
  // Answers map: { [questionId]: 'A' | 'B' | 'C' | 'D' }
  const [answers, setAnswers] = useState<Record<string, OptionKey>>({});
  // Review marked set: Set of questionIds
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());

  // Timer State
  const totalSeconds = subject.time_limit * 60;
  const [secondsRemaining, setSecondsRemaining] = useState(totalSeconds);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Submission & Results State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [resultAttempt, setResultAttempt] = useState<Attempt | null>(null);
  const [resultRank, setResultRank] = useState<number>(1);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'incorrect' | 'skipped'>('all');

  // Trigger countdown when exam starts
  useEffect(() => {
    if (phase === 'in_progress') {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleFinalSubmit(true); // Auto-submit on timeout
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  // Start Exam Handler
  const handleStartExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      setNameError('Please enter your full name to proceed with the exam.');
      return;
    }
    if (!rulesAgreed) {
      setNameError('You must agree to the academic honesty code and rules.');
      return;
    }
    setNameError('');
    setPhase('in_progress');
  };

  // Option selection
  const handleSelectOption = (option: OptionKey) => {
    const currentQ = questions[currentIndex];
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: option,
    }));
  };

  // Clear current response
  const handleClearResponse = () => {
    const currentQ = questions[currentIndex];
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentQ.id];
      return copy;
    });
  };

  // Toggle mark for review
  const handleToggleReview = () => {
    const currentQ = questions[currentIndex];
    setMarkedForReview((prev) => {
      const next = new Set(prev);
      if (next.has(currentQ.id)) {
        next.delete(currentQ.id);
      } else {
        next.add(currentQ.id);
      }
      return next;
    });
  };

  // Question status helper
  const getQuestionStatus = (qId: string) => {
    const isAnswered = Boolean(answers[qId]);
    const isMarked = markedForReview.has(qId);
    if (isAnswered && isMarked) return 'answered_marked';
    if (isMarked) return 'marked';
    if (isAnswered) return 'answered';
    return 'unanswered';
  };

  // Final Submit Handler
  const handleFinalSubmit = async (isAutoSubmit = false) => {
    if (phase === 'submitting' || phase === 'results') return;
    setPhase('submitting');
    setShowSubmitModal(false);
    if (timerRef.current) clearInterval(timerRef.current);

    const timeTaken = Math.max(1, totalSeconds - secondsRemaining);

    try {
      const payload = {
        subject_id: subject.id,
        student_name: studentName.trim(),
        roll_no: rollNo.trim() || undefined,
        time_taken_seconds: timeTaken,
        answers: questions.map((q) => ({
          question_id: q.id,
          selected_option: answers[q.id] || null,
        })),
      };

      const res = await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit test');
      }

      const data = await res.json();
      setResultAttempt(data.attempt);
      setResultRank(data.rank || 1);
      setPhase('results');

      // Trigger Confetti if passed!
      if (data.attempt.passed) {
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Submission failed';
      setSubmitError(message);
      setPhase('in_progress'); // return to exam
    }
  };

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;
  const markedCount = markedForReview.size;

  // ==========================================
  // PHASE 1: PRE-TEST INSTRUCTIONS SCREEN
  // ==========================================
  if (phase === 'instructions') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Available Subjects
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 px-6 sm:px-8 py-8 text-white">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-indigo-100 border border-white/20 backdrop-blur-sm mb-3">
              Official Examination Lobby
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {subject.title}
            </h1>
            <p className="mt-2 text-indigo-100 text-sm sm:text-base leading-relaxed">
              {subject.description || 'Test your knowledge with timed questions. Complete and submit to see your rank.'}
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {/* Exam Parameters Grid */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Examination Specifications
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <Clock className="w-5 h-5 text-indigo-700 mx-auto mb-1" />
                  <p className="text-lg font-bold text-slate-900">{subject.time_limit} Mins</p>
                  <p className="text-xs text-slate-700">Duration</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <HelpCircle className="w-5 h-5 text-indigo-700 mx-auto mb-1" />
                  <p className="text-lg font-bold text-slate-900">{questions.length}</p>
                  <p className="text-xs text-slate-700">Questions</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <Percent className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-slate-900">{subject.passing_score}%</p>
                  <p className="text-xs text-slate-700">Passing Mark</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <AlertTriangle className={`w-5 h-5 mx-auto mb-1 ${subject.negative_marking ? 'text-rose-500' : 'text-emerald-500'}`} />
                  <p className="text-lg font-bold text-slate-900">
                    {subject.negative_marking ? `-${subject.negative_mark_value}` : 'None'}
                  </p>
                  <p className="text-xs text-slate-700">Negative Mark</p>
                </div>
              </div>
            </div>

            {/* Test Guidelines */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/80 space-y-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-700" />
                Examination Protocol & Guidelines
              </h3>
              <ul className="text-xs sm:text-sm text-slate-700 space-y-2 list-disc list-inside">
                <li>The timer will initiate as soon as you press <strong>Begin Examination</strong>.</li>
                <li>When the countdown timer reaches <strong>00:00</strong>, your exam will auto-submit automatically.</li>
                <li>You can jump freely between questions using the Question Palette sidebar.</li>
                <li>Use <strong>Mark for Review</strong> on questions you wish to double-check before submission.</li>
                <li>Upon submitting, you will immediately see your detailed score, correct answers, explanations, and live leaderboard rank.</li>
              </ul>
            </div>

            {/* Student Registration Form */}
            <form onSubmit={handleStartExam} className="space-y-5 pt-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Candidate Identification
              </h2>

              {nameError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{nameError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-700" />
                    Candidate Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  />
                  <p className="text-[11px] text-slate-700 mt-1">This name will be displayed on the public leaderboard.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-slate-600" />
                    Roll No. / Batch / ID <span className="text-slate-700 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CS-2024-082"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  />
                  <p className="text-[11px] text-slate-700 mt-1">Optional identifier for class or cohort tracking.</p>
                </div>
              </div>

              {/* Honor checkbox */}
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={rulesAgreed}
                  onChange={(e) => setRulesAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-700 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-xs text-slate-700 leading-relaxed">
                  I certify that I am taking this test independently under academic honesty rules without unauthorized external assistance.
                </span>
              </label>

              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm sm:text-base shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
              >
                <span>Begin Examination</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // PHASE 2: LIVE EXAM INTERFACE
  // ==========================================
  if (phase === 'in_progress' || phase === 'submitting') {
    const isTimeCritical = secondsRemaining <= 120; // less than 2 mins
    const isTimeWarning = secondsRemaining <= 300 && !isTimeCritical; // less than 5 mins

    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
        {/* Sticky Exam Top Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            {/* Subject and candidate */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="hidden sm:flex w-9 h-9 rounded-lg bg-indigo-600 text-white items-center justify-center font-bold text-sm shrink-0">
                {currentIndex + 1}
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                  {subject.title}
                </h1>
                <p className="text-xs text-slate-700 truncate">
                  Candidate: <strong className="text-slate-700">{studentName}</strong> {rollNo ? `(${rollNo})` : ''}
                </p>
              </div>
            </div>

            {/* Countdown Clock & Submit Button */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Timer Pill */}
              <div
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-mono font-bold transition-colors ${
                  isTimeCritical
                    ? 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse'
                    : isTimeWarning
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-slate-100 text-slate-800 border border-slate-200'
                }`}
              >
                <Clock className={`w-4 h-4 ${isTimeCritical ? 'text-rose-600' : 'text-slate-600'}`} />
                <span>{formatTime(secondsRemaining)}</span>
              </div>

              {/* Submit CTA */}
              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Submit Test</span>
                <span className="sm:hidden">Submit</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Exam Body */}
        <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Question Presentation Area (8 cols on lg) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-8">
              {/* Question Sub-header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  {markedForReview.has(currentQuestion.id) && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <Bookmark className="w-3 h-3 fill-amber-500" />
                      Marked for Review
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleToggleReview}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    markedForReview.has(currentQuestion.id)
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{markedForReview.has(currentQuestion.id) ? 'Unmark Review' : 'Mark for Review'}</span>
                </button>
              </div>

              {/* Question Text */}
              <div className="mb-8">
                <FormattedText text={currentQuestion.question_text} className="text-base sm:text-lg text-slate-900 font-medium" />
              </div>

              {/* Options A, B, C, D */}
              <div className="space-y-3">
                {(['A', 'B', 'C', 'D'] as OptionKey[]).map((optKey) => {
                  const optField = `option_${optKey.toLowerCase()}` as keyof PublicQuestion;
                  const optionValue = currentQuestion[optField] as string;
                  const isSelected = answers[currentQuestion.id] === optKey;

                  return (
                    <button
                      key={optKey}
                      type="button"
                      onClick={() => handleSelectOption(optKey)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3.5 group cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 shadow-sm ring-1 ring-indigo-600'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'
                        }`}
                      >
                        {optKey}
                      </span>
                      <div className="flex-1 text-sm sm:text-base text-slate-800 pt-0.5 leading-relaxed">
                        <FormattedText text={optionValue} />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Bottom Actions Row */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                    className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  {answers[currentQuestion.id] && (
                    <button
                      type="button"
                      onClick={handleClearResponse}
                      className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Clear Selection</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {currentIndex < questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                      className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <span>Next Question</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowSubmitModal(true)}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Review & Submit</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Question Palette Sidebar (4 cols on lg) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Question Navigation Palette</h3>
                <p className="text-xs text-slate-700 mt-0.5">Click any number to jump directly to that question.</p>
              </div>

              {/* Status Counters Legend */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded bg-emerald-500 shrink-0" />
                  <span className="text-emerald-900 font-medium">Answered: <strong>{answeredCount}</strong></span>
                </div>
                <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded bg-slate-300 shrink-0" />
                  <span className="text-slate-700 font-medium">Unanswered: <strong>{unansweredCount}</strong></span>
                </div>
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2 col-span-2">
                  <div className="w-3.5 h-3.5 rounded bg-amber-500 shrink-0" />
                  <span className="text-amber-900 font-medium">Marked for Review: <strong>{markedCount}</strong></span>
                </div>
              </div>

              {/* Numbered Palette Grid */}
              <div className="pt-2 border-t border-slate-100">
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, idx) => {
                    const status = getQuestionStatus(q.id);
                    const isCurrent = idx === currentIndex;

                    let bgClass = 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
                    if (status === 'answered') {
                      bgClass = 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700';
                    } else if (status === 'marked') {
                      bgClass = 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600';
                    } else if (status === 'answered_marked') {
                      bgClass = 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-amber-400 hover:bg-indigo-700';
                    }

                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setCurrentIndex(idx)}
                        className={`h-10 rounded-xl font-bold text-xs border flex items-center justify-center transition-all ${bgClass} ${
                          isCurrent ? 'ring-2 ring-slate-900 ring-offset-2' : ''
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button in Sidebar */}
              <div className="pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(true)}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Finish & Submit Test
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Submit Examination?</h3>
                  <p className="text-xs text-slate-700">Please review your answer summary before final grading.</p>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <p className="font-bold text-slate-900 text-lg">{questions.length}</p>
                  <p className="text-slate-700">Total MCQs</p>
                </div>
                <div>
                  <p className="font-bold text-emerald-600 text-lg">{answeredCount}</p>
                  <p className="text-slate-700">Answered</p>
                </div>
                <div>
                  <p className="font-bold text-rose-500 text-lg">{unansweredCount}</p>
                  <p className="text-slate-700">Unanswered</p>
                </div>
              </div>

              {unansweredCount > 0 && (
                <p className="text-xs text-amber-800 bg-amber-50 p-3 rounded-lg border border-amber-200">
                  Notice: You have <strong>{unansweredCount} unanswered questions</strong>. Any unanswered questions will receive 0 marks.
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Return to Test
                </button>
                <button
                  type="button"
                  onClick={() => handleFinalSubmit(false)}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Yes, Submit Exam
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // PHASE 3: INSTANT RESULTS & ANSWER KEY
  // ==========================================
  if (phase === 'results' && resultAttempt) {
    const passed = resultAttempt.passed;
    const accuracy = resultAttempt.answered_count > 0
      ? Math.round((resultAttempt.correct_count / resultAttempt.answered_count) * 100)
      : 0;

    const filteredAnswers = resultAttempt.answers.filter((item) => {
      if (reviewFilter === 'correct') return item.is_correct;
      if (reviewFilter === 'incorrect') return item.selected_option && !item.is_correct;
      if (reviewFilter === 'skipped') return !item.selected_option;
      return true;
    });

    return (
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        {/* Pass / Fail Hero Card */}
        <div
          className={`rounded-2xl border p-6 sm:p-8 text-center relative overflow-hidden shadow-sm ${
            passed
              ? 'bg-gradient-to-b from-emerald-500/10 via-emerald-50/50 to-white border-emerald-200'
              : 'bg-gradient-to-b from-rose-500/10 via-rose-50/50 to-white border-rose-200'
          }`}
        >
          <div className="inline-flex p-3 rounded-2xl mb-3 shadow-inner bg-white">
            {passed ? (
              <Trophy className="w-10 h-10 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-10 h-10 text-rose-500" />
            )}
          </div>

          <div className="space-y-1">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {passed ? 'Passed Evaluation' : 'Did Not Meet Passing Mark'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {passed ? `Congratulations, ${studentName}!` : `Good effort, ${studentName}!`}
            </h1>
            <p className="text-slate-700 text-sm max-w-lg mx-auto">
              {passed
                ? `You passed "${subject.title}" with a final score of ${resultAttempt.score} / ${resultAttempt.total_questions} (${resultAttempt.percentage}%).`
                : `You scored ${resultAttempt.score} / ${resultAttempt.total_questions} (${resultAttempt.percentage}%). The passing threshold is ${subject.passing_score}%.`}
            </p>
          </div>

          {/* Quick Metrics Grid */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <Award className="w-4 h-4 text-indigo-700 mx-auto mb-1" />
              <p className="text-xl font-bold text-slate-900">{resultAttempt.score} / {resultAttempt.total_questions}</p>
              <p className="text-xs text-slate-700">Total Score</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <Percent className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-slate-900">{resultAttempt.percentage}%</p>
              <p className="text-xs text-slate-700">Percentage</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-sky-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-slate-900">{accuracy}%</p>
              <p className="text-xs text-slate-700">Accuracy</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <Clock className="w-4 h-4 text-amber-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-slate-900">{formatTime(resultAttempt.time_taken_seconds)}</p>
              <p className="text-xs text-slate-700">Time Taken</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
              <Trophy className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-indigo-700">Rank #{resultRank}</p>
              <p className="text-xs text-slate-700">Live Leaderboard</p>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/leaderboard?subject=${subject.id}&highlight=${resultAttempt.id}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all"
            >
              <Trophy className="w-4 h-4 text-amber-300" />
              <span>View Your Position on Leaderboard</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                setPhase('instructions');
                setCurrentIndex(0);
                setAnswers({});
                setMarkedForReview(new Set());
                setSecondsRemaining(totalSeconds);
                setResultAttempt(null);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake Test</span>
            </button>

            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-colors"
            >
              <span>Explore Other Subjects</span>
            </Link>
          </div>
        </div>

        {/* Question-By-Question Detailed Answer Key */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Detailed Answer Key & Explanations</h2>
              <p className="text-xs text-slate-700">Review your answers alongside official verified explanations.</p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {(['all', 'correct', 'incorrect', 'skipped'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setReviewFilter(filter)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    reviewFilter === filter
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {filteredAnswers.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-700 text-sm">
              No questions match the selected filter.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAnswers.map((item, idx) => {
                const isCorrect = item.is_correct;
                const isSkipped = !item.selected_option;

                return (
                  <div
                    key={item.question_id}
                    className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-xs space-y-4 ${
                      isCorrect
                        ? 'border-emerald-200'
                        : isSkipped
                        ? 'border-slate-200'
                        : 'border-rose-200'
                    }`}
                  >
                    {/* Item Header */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                          MCQ #{idx + 1}
                        </span>
                        {isCorrect ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            <Check className="w-3.5 h-3.5" />
                            Correct (+1.0)
                          </span>
                        ) : isSkipped ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                            Skipped (0.0)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                            <XCircle className="w-3.5 h-3.5" />
                            Incorrect ({item.marks_awarded})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Question Content */}
                    <div>
                      <FormattedText text={item.question_text} className="text-sm sm:text-base font-medium text-slate-900" />
                    </div>

                    {/* Options Review Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                      {(['A', 'B', 'C', 'D'] as OptionKey[]).map((opt) => {
                        const optText = item[`option_${opt.toLowerCase()}` as keyof QuestionReviewItem] as string;
                        const isStudentChoice = item.selected_option === opt;
                        const isTheCorrectChoice = item.correct_option === opt;

                        let optCardClass = 'border-slate-200 bg-white text-slate-700';
                        if (isTheCorrectChoice) {
                          optCardClass = 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-semibold ring-1 ring-emerald-500';
                        } else if (isStudentChoice && !isCorrect) {
                          optCardClass = 'border-rose-500 bg-rose-50/70 text-rose-950 line-through';
                        }

                        return (
                          <div
                            key={opt}
                            className={`p-3 rounded-xl border flex items-start gap-2.5 ${optCardClass}`}
                          >
                            <span
                              className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                isTheCorrectChoice
                                  ? 'bg-emerald-600 text-white'
                                  : isStudentChoice
                                  ? 'bg-rose-500 text-white'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {opt}
                            </span>
                            <div className="flex-1">
                              <span>{optText}</span>
                              {isStudentChoice && (
                                <span className="ml-1 text-[10px] uppercase font-bold text-indigo-700">
                                  (Your Choice)
                                </span>
                              )}
                              {isTheCorrectChoice && (
                                <span className="ml-1 text-[10px] uppercase font-bold text-emerald-700">
                                  (Correct Answer)
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation Box */}
                    {item.explanation && (
                      <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs sm:text-sm space-y-1">
                        <div className="font-bold text-indigo-950 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-700" />
                          <span>Administrator Explanation:</span>
                        </div>
                        <FormattedText text={item.explanation} className="text-slate-700 leading-relaxed" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
