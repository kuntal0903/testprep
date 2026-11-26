'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Subject, LeaderboardEntry } from '@/types';
import { 
  Trophy, 
  Medal, 
  Clock, 
  Crown, 
  Search, 
  RotateCw, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  ArrowRight,
  Filter,
  User,
  Hash
} from 'lucide-react';

interface LeaderboardViewProps {
  initialSubjects: Subject[];
  initialLeaderboard: LeaderboardEntry[];
  initialSubjectId?: string;
}

export function LeaderboardView({
  initialSubjects,
  initialLeaderboard,
  initialSubjectId = 'all',
}: LeaderboardViewProps) {
  const searchParams = useSearchParams();
  const highlightedAttemptId = searchParams.get('highlight') || '';
  const urlSubjectParam = searchParams.get('subject') || initialSubjectId;

  const [selectedSubject, setSelectedSubject] = useState<string>(urlSubjectParam);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(initialLeaderboard);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Format time taken to mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  // Format date nicely
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Fetch updated leaderboard when filter changes
  const fetchLeaderboard = async (subjectId: string) => {
    setIsLoading(true);
    try {
      const url = subjectId && subjectId !== 'all'
        ? `/api/leaderboard?subject_id=${subjectId}`
        : '/api/leaderboard';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
      }
    } catch (err) {
      console.error('Failed to reload leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubject(subjectId);
    fetchLeaderboard(subjectId);
  };

  // Filter entries by search query
  const filteredEntries = leaderboard.filter((entry) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      entry.student_name.toLowerCase().includes(query) ||
      (entry.roll_no && entry.roll_no.toLowerCase().includes(query)) ||
      entry.subject_title.toLowerCase().includes(query)
    );
  });

  const top1 = filteredEntries.find((e) => e.rank === 1);
  const top2 = filteredEntries.find((e) => e.rank === 2);
  const top3 = filteredEntries.find((e) => e.rank === 3);
  const tableEntries = filteredEntries.filter((e) => e.rank > 3);

  const highlightedEntry = highlightedAttemptId
    ? leaderboard.find((e) => e.id === highlightedAttemptId)
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 mb-2 shadow-xs">
            <Crown className="w-3.5 h-3.5 text-amber-600" />
            THIS IS THE TOPPERS
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            THIS IS THE TOPPERS
          </h1>
          <p className="text-slate-700 text-sm mt-1">
            Behold the undisputed champions. Ranked by highest score and percentage, using fastest completion time as an objective tie-breaker.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchLeaderboard(selectedSubject)}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 shadow-xs"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-700' : ''}`} />
            <span>Refresh Ranks</span>
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
          >
            <span>Take An Exam</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Post-Test Candidate Highlight Banner */}
      {highlightedEntry && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-900 to-slate-900 text-white shadow-lg border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-extrabold text-lg shrink-0 shadow-md">
              #{highlightedEntry.rank}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                  Your Submitted Test
                </span>
                <span className="text-xs text-slate-300">• {formatDate(highlightedEntry.created_at)}</span>
              </div>
              <p className="font-bold text-base sm:text-lg text-white mt-0.5">
                {highlightedEntry.student_name}
              </p>
              <p className="text-xs text-slate-300">
                {highlightedEntry.subject_title} • Score: <strong>{highlightedEntry.score} / {highlightedEntry.total_questions}</strong> ({highlightedEntry.percentage}%) • Time: <strong>{formatTime(highlightedEntry.time_taken_seconds)}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/10 text-emerald-300 border border-emerald-400/30">
              Ranked #{highlightedEntry.rank} of {leaderboard.length}
            </span>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Subject Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => handleSubjectChange('all')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                selectedSubject === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              All Subjects (Overall)
            </button>

            {initialSubjects.map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => handleSubjectChange(sub.id)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  selectedSubject === sub.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {sub.title}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search candidate name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50"
            />
          </div>
        </div>
      </div>

      {/* TOP 3 PODIUM DISPLAY */}
      {filteredEntries.length > 0 ? (
        <div>
          <div className="text-center mb-6">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-amber-900 bg-amber-50 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-amber-200">
              <Crown className="w-3.5 h-3.5 text-amber-600" />
              THIS IS THE TOPPERS • TOP 3 HONOR ROLL
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end max-w-4xl mx-auto">
            {/* Rank 2 (Silver) - Positioned Left */}
            <div className="order-2 md:order-1">
              {top2 ? (
                <div
                  className={`bg-white rounded-2xl border-2 border-slate-300 p-5 text-center shadow-sm relative overflow-hidden transition-all hover:-translate-y-1 ${
                    highlightedAttemptId === top2.id ? 'ring-2 ring-indigo-600' : ''
                  }`}
                >
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-slate-300" />
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-200 to-slate-100 text-slate-700 flex items-center justify-center font-extrabold text-xl mx-auto shadow-inner mb-3 border border-slate-300">
                    <Medal className="w-7 h-7 text-slate-500" />
                  </div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300 mb-1">
                    Rank #2 • Silver
                  </span>
                  <h3 className="font-bold text-base text-slate-900 truncate">
                    {top2.student_name}
                  </h3>
                  {top2.roll_no && <p className="text-xs text-slate-700">{top2.roll_no}</p>}
                  <p className="text-xs text-slate-700 line-clamp-1 mt-1">{top2.subject_title}</p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-4 text-xs">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{top2.score} pts</p>
                      <p className="text-slate-700">{top2.percentage}%</p>
                    </div>
                    <div className="border-l border-slate-200 pl-4">
                      <p className="font-bold text-slate-900 text-sm flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-600" />
                        {formatTime(top2.time_taken_seconds)}
                      </p>
                      <p className="text-slate-700">Time</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-600">
                  Position Unclaimed
                </div>
              )}
            </div>

            {/* Rank 1 (Gold) - Positioned Center (Highest & Prominent) */}
            <div className="order-1 md:order-2">
              {top1 ? (
                <div
                  className={`bg-white rounded-2xl border-2 border-amber-400 p-6 text-center shadow-md relative overflow-hidden transition-all hover:-translate-y-1.5 md:-mt-4 ${
                    highlightedAttemptId === top1.id ? 'ring-2 ring-indigo-600' : ''
                  }`}
                >
                  <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center font-extrabold text-2xl mx-auto shadow-md mb-3 border border-amber-300">
                    <Crown className="w-8 h-8 text-amber-900" />
                  </div>
                  <span className="inline-block px-3 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 mb-1">
                    Rank #1 • Champion
                  </span>
                  <h3 className="font-extrabold text-lg text-slate-900 truncate">
                    {top1.student_name}
                  </h3>
                  {top1.roll_no && <p className="text-xs text-slate-700">{top1.roll_no}</p>}
                  <p className="text-xs text-slate-700 line-clamp-1 mt-1">{top1.subject_title}</p>

                  <div className="mt-4 pt-3 border-t border-amber-100 flex items-center justify-center gap-5 text-xs">
                    <div>
                      <p className="font-extrabold text-slate-900 text-base">{top1.score} pts</p>
                      <p className="text-emerald-700 font-bold">{top1.percentage}%</p>
                    </div>
                    <div className="border-l border-amber-200 pl-5">
                      <p className="font-bold text-slate-900 text-base flex items-center gap-1">
                        <Clock className="w-4 h-4 text-amber-600" />
                        {formatTime(top1.time_taken_seconds)}
                      </p>
                      <p className="text-slate-700">Time</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-600">
                  Position Unclaimed
                </div>
              )}
            </div>

            {/* Rank 3 (Bronze) - Positioned Right */}
            <div className="order-3">
              {top3 ? (
                <div
                  className={`bg-white rounded-2xl border-2 border-amber-700/30 p-5 text-center shadow-sm relative overflow-hidden transition-all hover:-translate-y-1 ${
                    highlightedAttemptId === top3.id ? 'ring-2 ring-indigo-600' : ''
                  }`}
                >
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-amber-700/60" />
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-100 to-amber-50 text-amber-900 flex items-center justify-center font-extrabold text-xl mx-auto shadow-inner mb-3 border border-amber-200">
                    <Medal className="w-7 h-7 text-amber-700" />
                  </div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 mb-1">
                    Rank #3 • Bronze
                  </span>
                  <h3 className="font-bold text-base text-slate-900 truncate">
                    {top3.student_name}
                  </h3>
                  {top3.roll_no && <p className="text-xs text-slate-700">{top3.roll_no}</p>}
                  <p className="text-xs text-slate-700 line-clamp-1 mt-1">{top3.subject_title}</p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-4 text-xs">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{top3.score} pts</p>
                      <p className="text-slate-700">{top3.percentage}%</p>
                    </div>
                    <div className="border-l border-slate-200 pl-4">
                      <p className="font-bold text-slate-900 text-sm flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-600" />
                        {formatTime(top3.time_taken_seconds)}
                      </p>
                      <p className="text-slate-700">Time</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-600">
                  Position Unclaimed
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Ranks 4 to 25 Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Ranks 4 – 25 Standings</h2>
            <p className="text-xs text-slate-700">Official order of merit</p>
          </div>
          <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
            {filteredEntries.length} Ranked Attempts
          </span>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="p-12 text-center text-slate-700">
            <Trophy className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold">No Leaderboard Entries Found</p>
            <p className="text-xs text-slate-600 mt-1">
              Be the first to take this test and claim Rank #1!
            </p>
          </div>
        ) : tableEntries.length === 0 ? (
          <div className="p-8 text-center text-slate-700 text-xs">
            All current contenders are highlighted on the Top 3 Podium above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Percentage</th>
                  <th className="py-3 px-4">Time Taken</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tableEntries.slice(0, 22).map((entry) => {
                  const isHighlighted = entry.id === highlightedAttemptId;
                  return (
                    <tr
                      key={entry.id}
                      className={`transition-colors ${
                        isHighlighted
                          ? 'bg-indigo-50/80 font-semibold'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <span className="w-7 h-7 rounded-lg bg-slate-100 font-bold text-slate-700 flex items-center justify-center text-xs">
                          #{entry.rank}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{entry.student_name}</div>
                        {entry.roll_no && (
                          <div className="text-[11px] text-slate-700 font-normal">{entry.roll_no}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 max-w-[200px] truncate">
                        {entry.subject_title}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {entry.score} / {entry.total_questions}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {entry.percentage}%
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {formatTime(entry.time_taken_seconds)}
                      </td>

                      <td className="py-3.5 px-4">
                        {entry.passed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            Pass
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">
                            <XCircle className="w-3 h-3" />
                            Fail
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right text-slate-700 text-xs">
                        {formatDate(entry.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
