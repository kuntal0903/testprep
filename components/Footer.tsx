import React from 'react';
import Link from 'next/link';
import { GraduationCap, Trophy, ShieldCheck, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">TESTPREP</p>
              <p className="text-xs text-slate-700">Distraction-free academic online MCQ exam & quiz platform</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-700">
            <Link href="/" className="hover:text-indigo-600 transition-colors">
              Available Tests
            </Link>
            <Link href="/leaderboard" className="hover:text-indigo-600 transition-colors flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              Live Leaderboard
            </Link>
            <Link href="/admin" className="hover:text-indigo-600 transition-colors flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-700" />
              Admin Area
            </Link>
          </div>

          <p className="text-xs text-slate-700 flex items-center gap-1">
            Built for academic excellence & fair evaluation
          </p>
        </div>
      </div>
    </footer>
  );
}