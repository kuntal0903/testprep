import React, { Suspense } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { getSubjects, getLeaderboard } from '@/lib/db';
import { LeaderboardView } from '@/components/LeaderboardView';

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage(props: {
  searchParams: Promise<{ subject?: string; highlight?: string }>;
}) {
  const { subject } = await props.searchParams;
  const [subjects, leaderboard] = await Promise.all([
    getSubjects(),
    getLeaderboard(subject || 'all'),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={
          <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-700">
            <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm font-medium">Loading Hall of Fame & Leaderboard...</p>
          </div>
        }>
          <LeaderboardView
            initialSubjects={subjects}
            initialLeaderboard={leaderboard}
            initialSubjectId={subject || 'all'}
          />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
