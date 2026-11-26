'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Subject, 
  Question, 
  Attempt, 
  AdminStats, 
  OptionKey 
} from '@/types';
import { FormattedText } from '@/components/FormattedText';
import { 
  ShieldCheck, 
  BookOpen, 
  HelpCircle, 
  Trophy, 
  Upload, 
  Download, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertTriangle, 
  LogOut, 
  Clock, 
  Percent, 
  RefreshCw, 
  FileText, 
  Search, 
  Database,
  Key,
  ExternalLink,
  ChevronRight,
  Layers,
  Sparkles,
  BarChart3
} from 'lucide-react';

export function AdminDashboard() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [secretInput, setSecretInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'subjects' | 'questions' | 'import-export' | 'moderation' | 'database'>('overview');

  // Core Data State
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals & Form State
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectForm, setSubjectForm] = useState({
    title: '',
    description: '',
    time_limit: 15,
    negative_marking: false,
    negative_mark_value: 0.25,
    passing_score: 60,
  });

  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: 'A' as OptionKey,
    explanation: '',
  });

  // Bulk Import State
  const [importTargetSubjectId, setImportTargetSubjectId] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [csvRawText, setCsvRawText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Check auth session on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/check');
      const data = await res.json();
      setIsAuthenticated(data.isAdmin);
      if (data.isAdmin) {
        loadAllData();
      }
    } catch {
      setIsAuthenticated(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setAuthError('');

    try {
      const res = await fetch('/api/auth/login', {\n        method: 'POST',\n        headers: { 'Content-Type': 'application/json' },\n        body: JSON.stringify({ secretKey: secretInput }),\n      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Invalid credentials');
      }

      setIsAuthenticated(true);
      loadAllData();
    } catch (err: unknown) {\n      const message = err instanceof Error ? err.message : 'Login failed';\n      setAuthError(message);\n    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setIsAuthenticated(false);
  };

  // Load Admin Data
  const loadAllData = async () => {
    setIsLoadingData(true);
    try {
      const [statsRes, subsRes, attsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/subjects'),
        fetch('/api/attempts'),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (subsRes.ok) {
        const subs = await subsRes.json();
        setSubjects(subs);
        if (subs.length > 0 && !selectedSubjectId) {
          setSelectedSubjectId(subs[0].id);
          setImportTargetSubjectId(subs[0].id);
          loadQuestions(subs[0].id);
        }
      }
      if (attsRes.ok) setAttempts(await attsRes.json());
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadQuestions = async (subjectId: string) => {
    if (!subjectId) return;
    try {
      const res = await fetch(`/api/questions?subject_id=${subjectId}`);
      if (res.ok) {
        setQuestions(await res.json());
      }
    } catch (err) {
      console.error('Failed to load questions:', err);
    }
  };

  const showBanner = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 4000);
  };

  // ==========================================
  // SUBJECT MANAGEMENT HANDLERS
  // ==========================================
  const openSubjectModal = (sub?: Subject) => {
    if (sub) {
      setEditingSubject(sub);
      setSubjectForm({
        title: sub.title,
        description: sub.description,
        time_limit: sub.time_limit,
        negative_marking: sub.negative_marking,
        negative_mark_value: sub.negative_mark_value,
        passing_score: sub.passing_score,
      });
    } else {
      setEditingSubject(null);
      setSubjectForm({
        title: '',
        description: '',
        time_limit: 15,
        negative_marking: false,
        negative_mark_value: 0.25,
        passing_score: 60,
      });
    }
    setShowSubjectModal(true);
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSubject) {
        const res = await fetch(`/api/subjects/${editingSubject.id}`, {\n          method: 'PUT',\n          headers: { 'Content-Type': 'application/json' },\n          body: JSON.stringify(subjectForm),\n        });
        if (!res.ok) throw new Error('Failed to update subject');
        showBanner('success', `Subject "${subjectForm.title}" updated successfully.`);
      } else {
        const res = await fetch('/api/subjects', {\n          method: 'POST',\n          headers: { 'Content-Type': 'application/json' },\n          body: JSON.stringify(subjectForm),\n        });
        if (!res.ok) throw new Error('Failed to create subject');
        showBanner('success', `Subject "${subjectForm.title}" created successfully.`);
      }
      setShowSubjectModal(false);
      loadAllData();
    } catch (err: unknown) {\n      const message = err instanceof Error ? err.message : 'Error saving subject';\n      showBanner('error', message);\n    }
  };

  const handleDeleteSubject = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This will also delete all its questions and test attempts.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/subjects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete subject');
      showBanner('success', `Subject "${title}" deleted.`);
      loadAllData();
    } catch (err: unknown) {\n      const message = err instanceof Error ? err.message : 'Error deleting subject';\n      showBanner('error', message);\n    }
  };

  // ==========================================
  // QUESTION MANAGEMENT HANDLERS
  // ==========================================
  const openQuestionModal = (q?: Question) => {
    if (q) {
      setEditingQuestion(q);
      setQuestionForm({
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_option: q.correct_option,
        explanation: q.explanation,
      });
    } else {
      setEditingQuestion(null);
      setQuestionForm({
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_option: 'A',
        explanation: '',
      });
    }
    setShowQuestionModal(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId) {
      showBanner('error', 'Please select a subject first.');
      return;
    }

    try {
      if (editingQuestion) {
        const res = await fetch(`/api/questions/${editingQuestion.id}`, {\n          method: 'PUT',\n          headers: { 'Content-Type': 'application/json' },\n          body: JSON.stringify(questionForm),\n        });
        if (!res.ok) throw new Error('Failed to update question');
        showBanner('success', 'Question updated successfully.');
      } else {
        const res = await fetch('/api/questions', {\n          method: 'POST',\n          headers: { 'Content-Type': 'application/json' },\n          body: JSON.stringify({\n            ...questionForm,\n            subject_id: selectedSubjectId,\n          }),\n        });
        if (!res.ok) throw new Error('Failed to create question');
        showBanner('success', 'New MCQ added successfully.');
      }
      setShowQuestionModal(false);
      loadQuestions(selectedSubjectId);
      loadAllData();
    } catch (err: unknown) {\n      const message = err instanceof Error ? err.message : 'Error saving question';\n      showBanner('error', message);\n    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm('Delete this question permanently?')) return;
    try {
      const res = await fetch(`/api/questions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete question');
      showBanner('success', 'Question deleted.');
      loadQuestions(selectedSubjectId);
      loadAllData();
    } catch (err: unknown) {\n      const message = err instanceof Error ? err.message : 'Error deleting question';\n      showBanner('error', message);\n    }
  };

  // ==========================================
  // BULK IMPORT & EXPORT HANDLERS
  // ==========================================
  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importTargetSubjectId) {
      showBanner('error', 'Please select a target subject.');
      return;
    }

    setIsImporting(true);
    try {
      if (importFile) {
        const formData = new FormData();
        formData.append('subject_id', importTargetSubjectId);
        formData.append('file', importFile);

        const res = await fetch('/api/questions/import', {\n          method: 'POST',\n          body: formData,\n        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Import failed');
        showBanner('success', data.message || `Imported ${data.count} questions.`);
      } else if (csvRawText.trim()) {
        const res = await fetch('/api/questions/import', {\n          method: 'POST',\n          headers: { 'Content-Type': 'application/json' },\n          body: JSON.stringify({\n            subject_id: importTargetSubjectId,\n            csv_text: csvRawText.trim(),\n          }),\n        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Import failed');
        showBanner('success', data.message || `Imported ${data.count} questions.`);
      } else {
        throw new Error('Please choose a file or paste CSV text.');
      }

      setImportFile(null);
      setCsvRawText('');
      loadQuestions(importTargetSubjectId);
      loadAllData();
    } catch (err: unknown) {\n      const message = err instanceof Error ? err.message : 'Import failed';\n      showBanner('error', message);\n    } finally {
      setIsImporting(false);
    }
  };

  const downloadSampleJSON = () => {
    const sample = [
      {
        question_text: "What is the primary role of the Virtual DOM in React?",
        option_a: "Directly manipulate browser hardware acceleration",
        option_b: "Compute lightweight diffs in memory to minimize real DOM mutations",
        option_c: "Replace JavaScript engine garbage collection",
        option_d: "Encrypt client network payloads",
        correct_option: "B",
        explanation: "The Virtual DOM enables React to batch and minimize costly actual DOM updates via reconciliation."
      },
      {
        question_text: "Which SQL clause restricts rows returned by an aggregate function like COUNT() or AVG()?",
        option_a: "WHERE",
        option_b: "HAVING",
        option_c: "ORDER BY",
        option_d: "GROUP BY",
        correct_option: "B",
        explanation: "HAVING filters groups created by aggregate functions, whereas WHERE filters individual rows before grouping."
      }
    ];

    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_questions_template.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSampleCSV = () => {
    const csvContent = `question_text,option_a,option_b,option_c,option_d,correct_option,explanation\n"What does CSS box-sizing: border-box do?","Includes padding and border within element width and height","Excludes padding from height","Makes margins negative","Hides element overflow","A","border-box makes width and height cover content, padding, and border."\n"Which HTTP status indicates Unauthorized authentication failure?","200","401","404","500","B","HTTP 401 Unauthorized indicates that the request lacks valid credentials."`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_questions_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ==========================================
  // MODERATION HANDLERS
  // ==========================================
  const handleDeleteAttempt = async (attemptId: string, studentName: string) => {
    if (!window.confirm(`Delete attempt by "${studentName}"?`)) return;
    try {
      const res = await fetch(`/api/attempts/${attemptId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete attempt');
      showBanner('success', `Attempt for "${studentName}" removed.`);
      loadAllData();
    } catch (err: unknown) {\n      const message = err instanceof Error ? err.message : 'Error deleting attempt';\n      showBanner('error', message);\n    }
  };

  const handleResetLeaderboard = async () => {
    const target = selectedSubjectId || 'all';
    const subTitle = subjects.find((s) => s.id === target)?.title || 'All Subjects';
    if (!window.confirm(`Are you SURE you want to reset the leaderboard for "${subTitle}"? All completed scores will be permanently deleted.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/leaderboard?subject_id=${target}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to reset leaderboard');
      showBanner('success', `Leaderboard for "${subTitle}" was successfully reset.`);
      loadAllData();
    } catch (err: unknown) {\n      const message = err instanceof Error ? err.message : 'Error resetting leaderboard';\n      showBanner('error', message);\n    }
  };

  // ==========================================
  // 1. UN-AUTHENTICATED LOGIN SCREEN
  // ==========================================
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-12">
        <div className="max-w-md w-full bg-slate-800 rounded-3xl border border-slate-700 p-8 shadow-2xl space-y-6 text-white">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
              <Key className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Admin Authentication</h1>
            <p className="text-slate-400 text-xs sm:text-sm">
              Protected administrative control center for exam management.
            </p>
          </div>

          {authError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Admin Secret Key or Password
              </label>
              <input
                type="password"
                required
                autoFocus
                placeholder="Enter admin secret key"
                value={secretInput}
                onChange={(e) => setSecretInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoggingIn ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              <span>Authenticate Session</span>
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-700/60">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← Return to Public Student Lobby
            </Link>
          </div>
        </div>
      </div>
    );
  }


  // ==========================================
  // 2. AUTHENTICATED ADMIN DASHBOARD VIEW
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Admin Top Navigation */}
      <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-base tracking-tight flex items-center gap-2">
                TESTPREP Admin
                <span className="text-[10px] font-semibold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded-full">
                  Superuser
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Control Center & Question Publishing</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              <span>View Public Portal</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="bg-slate-900/80 border-t border-slate-800 px-4 sm:px-6 lg:px-8 overflow-x-auto scrollbar-none">
          <div className="max-w-7xl mx-auto flex items-center gap-2 py-2">
            {[
              { id: 'overview', name: 'Overview', icon: BarChart3 },
              { id: 'subjects', name: 'Subjects', icon: BookOpen },
              { id: 'questions', name: 'Question Bank', icon: HelpCircle },
              { id: 'import-export', name: 'Bulk Import / Export', icon: Upload },
              { id: 'moderation', name: 'Leaderboard Moderation', icon: Trophy },
              { id: 'database', name: 'Database & Supabase', icon: Database },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 w-full">
          <div
            className={`p-3.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
              actionMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {actionMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{actionMessage.text}</span>
            </div>
            <button
              onClick={() => setActionMessage(null)}
              className="text-xs opacity-70 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Admin Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ========================================================= */}
        {/* TAB 1: OVERVIEW & STATS                                   */}
        {/* ========================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Platform Analytics Overview</h2>
                <p className="text-xs text-slate-700">Global metrics across published subjects and student attempts.</p>
              </div>
              <button
                type="button"
                onClick={loadAllData}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Data</span>
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <BookOpen className="w-5 h-5 text-indigo-700 mb-2" />
                <p className="text-2xl font-extrabold text-slate-900">{stats?.total_subjects || 0}</p>
                <p className="text-xs text-slate-700 mt-0.5">Published Subjects</p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <HelpCircle className="w-5 h-5 text-sky-600 mb-2" />
                <p className="text-2xl font-extrabold text-slate-900">{stats?.total_questions || 0}</p>
                <p className="text-xs text-slate-700 mt-0.5">Total Questions</p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <Trophy className="w-5 h-5 text-amber-500 mb-2" />
                <p className="text-2xl font-extrabold text-slate-900">{stats?.total_attempts || 0}</p>
                <p className="text-xs text-slate-700 mt-0.5">Student Attempts</p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <BarChart3 className="w-5 h-5 text-purple-600 mb-2" />
                <p className="text-2xl font-extrabold text-slate-900">{stats?.average_score || 0}%</p>
                <p className="text-xs text-slate-700 mt-0.5">Mean Score</p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
                <Percent className="w-5 h-5 text-emerald-600 mb-2" />
                <p className="text-2xl font-extrabold text-slate-900">{stats?.pass_rate || 0}%</p>
                <p className="text-xs text-slate-700 mt-0.5">Overall Pass Rate</p>
              </div>
            </div>

            {/* Quick Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Add New Examination Subject</h3>
                  <p className="text-xs text-slate-700 mt-1">Configure time limits, negative marking penalties, and passing criteria.</p>
                </div>
                <button
                  type="button"
                  onClick={() => openSubjectModal()}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors self-start"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Subject</span>
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-sky-50 to-white border border-sky-100 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Bulk Import Questions</h3>
                  <p className="text-xs text-slate-700 mt-1">Upload .json or .csv files to rapidly populate question banks.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('import-export')}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-colors self-start"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Bulk Upload</span>
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-100 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Leaderboard Moderation</h3>
                  <p className="text-xs text-slate-700 mt-1">Audit student test attempts, delete spam entries, or reset subject rankings.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('moderation')}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors self-start"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Moderate Ranks</span>
                </button>
              </div>
            </div>

            {/* Recent Completed Attempts Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">Latest Completed Test Attempts</h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('moderation')}
                  className="text-xs text-indigo-700 font-semibold hover:underline"
                >
                  View All Attempts →
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Candidate</th>
                      <th className="py-2.5 px-4">Subject</th>
                      <th className="py-2.5 px-4">Score</th>
                      <th className="py-2.5 px-4">Result</th>
                      <th className="py-2.5 px-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attempts.slice(0, 5).map((att) => (
                      <tr key={att.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {att.student_name}
                          {att.roll_no && <span className="text-slate-700 font-normal ml-1">({att.roll_no})</span>}
                        </td>
                        <td className="py-3 px-4 text-slate-700">{att.subject_title}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{att.score} / {att.total_questions} ({att.percentage}%)</td>
                        <td className="py-3 px-4">
                          {att.passed ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              PASS
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              FAIL
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-700">
                          {new Date(att.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: SUBJECTS MANAGEMENT                                */}
        {/* ========================================================= */}
        {activeTab === 'subjects' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Subject Management</h2>
                <p className="text-xs text-slate-700">Create, configure, and manage curriculum modules.</p>
              </div>
              <button
                type="button"
                onClick={() => openSubjectModal()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Subject</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {subjects.map((sub) => (
                <div
                  key={sub.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                        Code: {sub.id}
                      </span>
                      {sub.negative_marking ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          -{sub.negative_mark_value} Neg. Mark
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          No Negative Mark
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-lg text-slate-900">{sub.title}</h3>
                    <p className="text-xs text-slate-700 leading-relaxed line-clamp-2">
                      {sub.description || 'No description provided.'}
                    </p>

                    <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="font-bold text-slate-900 block">{sub.question_count || 0}</span>
                        <span className="text-slate-700 text-[10px]">MCQs</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="font-bold text-slate-900 block">{sub.time_limit}m</span>
                        <span className="text-slate-700 text-[10px]">Timer</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="font-bold text-slate-900 block">{sub.passing_score}%</span>
                        <span className="text-slate-700 text-[10px]">Pass Mark</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSubjectId(sub.id);
                        loadQuestions(sub.id);
                        setActiveTab('questions');
                      }}
                      className="text-xs text-indigo-700 font-semibold hover:underline flex items-center gap-1"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      Manage MCQs ({sub.question_count || 0})
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openSubjectModal(sub)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                        title="Edit Subject"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSubject(sub.id, sub.title)}
                        className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Subject"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: QUESTION BANK & MCQS                               */}
        {/* ========================================================= */}
        {activeTab === 'questions' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Curated Question Editor</h2>
                <p className="text-xs text-slate-700">Add, format, and maintain 4-option MCQs with explanations.</p>
              </div>

              <div className="flex items-center gap-2">
                {/* Select Subject Selector */}
                <select
                  value={selectedSubjectId}
                  onChange={(e) => {
                    setSelectedSubjectId(e.target.value);
                    loadQuestions(e.target.value);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.question_count || 0} questions)
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => openQuestionModal()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add MCQ</span>
                </button>
              </div>
            </div>

            {/* Questions List */}
            {questions.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-700 space-y-3">
                <HelpCircle className="w-12 h-12 text-slate-400 mx-auto" />
                <h3 className="font-bold text-slate-900 text-base">No Questions in this Subject</h3>
                <p className="text-xs max-w-sm mx-auto">
                  Click &quot;Add MCQ&quot; above to create a question manually, or switch to the Bulk Import tab to upload a batch.
                </p>
                <button
                  type="button"
                  onClick={() => openQuestionModal()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add First Question
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                        Question #{idx + 1}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openQuestionModal(q)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                          title="Edit Question"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <FormattedText text={q.question_text} className="text-sm font-medium text-slate-900" />

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {(['A', 'B', 'C', 'D'] as OptionKey[]).map((opt) => {
                        const optKey = `option_${opt.toLowerCase()}` as keyof Question;
                        const isCorrect = q.correct_option === opt;
                        return (
                          <div
                            key={opt}
                            className={`p-2.5 rounded-xl border flex items-start gap-2 ${
                              isCorrect
                                ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950 font-semibold ring-1 ring-emerald-400'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <span
                              className={`w-4 h-4 rounded text-[10px] flex items-center justify-center font-bold shrink-0 ${
                                isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {opt}
                            </span>
                            <span className="flex-1">{q[optKey]}</span>
                            {isCorrect && (
                              <span className="text-[10px] text-emerald-700 font-bold uppercase shrink-0">
                                (Correct)
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                        <strong className="text-indigo-900 flex items-center gap-1 font-semibold">
                          <Sparkles className="w-3 h-3 text-indigo-600" />
                          Explanation provided to students:
                        </strong>
                        <p className="text-slate-600 leading-relaxed">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: BULK IMPORT & EXPORT                               */}
        {/* ========================================================= */}
        {activeTab === 'import-export' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Bulk Import & Question Bank Backup</h2>
              <p className="text-xs text-slate-700">Upload multiple questions at once via JSON or CSV, or export backups.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Import Section */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-indigo-700" />
                  <h3 className="font-bold text-slate-900 text-base">Bulk Upload Questions</h3>
                </div>

                <form onSubmit={handleBulkImport} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Destination Subject <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={importTargetSubjectId}
                      onChange={(e) => setImportTargetSubjectId(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="">Select target subject...</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      File Upload (.json or .csv)
                    </label>
                    <input
                      type="file"
                      accept=".json,.csv"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                    />
                  </div>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink mx-3 text-slate-600 text-[11px] font-semibold uppercase">Or Paste Raw CSV</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>

                  <div>
                    <textarea
                      rows={5}
                      placeholder={`question_text,option_a,option_b,option_c,option_d,correct_option,explanation\n"What is 2+2?","3","4","5","6","B","Basic arithmetic"`}
                      value={csvRawText}
                      onChange={(e) => setCsvRawText(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isImporting}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span>Start Bulk Import</span>
                  </button>
                </form>
              </div>

              {/* Download Templates & Export Backup */}
              <div className="space-y-6">
                {/* Download Sample Templates */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-bold text-slate-900 text-base">Sample Format Templates</h3>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Download sample starter files pre-populated with required columns (question_text, option_a..d, correct_option, explanation).
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={downloadSampleJSON}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-700" />
                      <span>Download Sample JSON</span>
                    </button>

                    <button
                      type="button"
                      onClick={downloadSampleCSV}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Download Sample CSV</span>
                    </button>
                  </div>
                </div>

                {/* Export Backup */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex items-center gap-2">
                    <Download className="w-5 h-5 text-sky-600" />
                    <h3 className="font-bold text-slate-900 text-base">Export Question Bank Backup</h3>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Export your complete database of subjects and MCQs as a clean JSON backup file.
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <a
                      href="/api/questions/export"
                      download
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Full Backup (.json)</span>
                    </a>

                    {selectedSubjectId && (
                      <a
                        href={`/api/questions/export?subject_id=${selectedSubjectId}`}
                        download
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-600" />
                        <span>Export Current Subject Only</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: LEADERBOARD & RESULTS MODERATION                   */}
        {/* ========================================================= */}
        {activeTab === 'moderation' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Leaderboard & Results Moderation</h2>
                <p className="text-xs text-slate-700">Audit all test attempts, purge spam scores, or reset subject rankings.</p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                >
                  <option value="">All Subjects</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleResetLeaderboard}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold shadow-xs transition-colors"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Reset Leaderboard</span>
                </button>
              </div>
            </div>

            {/* Moderation Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Candidate</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Score</th>
                      <th className="py-3 px-4">Percentage</th>
                      <th className="py-3 px-4">Time Taken</th>
                      <th className="py-3 px-4">Result</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attempts
                      .filter((a) => !selectedSubjectId || a.subject_id === selectedSubjectId)
                      .map((att) => (
                        <tr key={att.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {att.student_name}
                            {att.roll_no && <span className="text-slate-700 font-normal ml-1">({att.roll_no})</span>}
                          </td>
                          <td className="py-3 px-4 text-slate-700 max-w-[200px] truncate">{att.subject_title}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {att.score} / {att.total_questions}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{att.percentage}%</td>
                          <td className="py-3 px-4 font-mono text-slate-700">
                            {Math.floor(att.time_taken_seconds / 60)}m {att.time_taken_seconds % 60}s
                          </td>
                          <td className="py-3 px-4">
                            {att.passed ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                PASS
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                FAIL
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            {new Date(att.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteAttempt(att.id, att.student_name)}
                              className="p-1 rounded-md text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Attempt (Spam Moderation)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: DATABASE & SUPABASE CONNECTION                     */}
        {/* ========================================================= */}
        {activeTab === 'database' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Database Engine & Cloud Sync</h2>
              <p className="text-xs text-slate-700">Current storage architecture, schema scripts, and connection status.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-700" />
                  <h3 className="font-bold text-slate-900 text-base">Active Storage Mode</h3>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Mode:</span>
                    <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 text-[11px]">
                      Operational (Dual Supabase / Local Store)
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed pt-1">
                    When <code>NEXT_PUBLIC_SUPABASE_URL</code> and keys are provided in <code>.env.local</code>, the application connects directly to Supabase PostgreSQL with RLS.
                    If Supabase keys are not configured, it seamlessly uses the built-in local persistent store.
                  </p>
                </div>

                <div className="space-y-2 text-xs text-slate-700">
                  <h4 className="font-bold text-slate-900">How to Connect to Supabase Cloud:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600">
                    <li>Create a new project at <a href="https://supabase.com" target="_blank" className="text-indigo-600 underline">supabase.com</a>.</li>
                    <li>Open your Supabase SQL Editor and run the provided <code>schema.sql</code> script.</li>
                    <li>Copy your Project URL and Anon/Service-Role API keys into <code>.env.local</code>.</li>
                    <li>Restart the Next.js server with <code>npm run dev</code>.</li>
                  </ol>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-sky-600" />
                  <h3 className="font-bold text-slate-900 text-base">schema.sql Verification</h3>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  The complete PostgreSQL setup script is saved in the workspace root as <code>schema.sql</code>. It includes all tables, indexes, RLS security policies, and initial seed records.
                </p>

                <div className="p-3 rounded-xl bg-slate-900 text-emerald-300 font-mono text-[11px] overflow-x-auto max-h-48">
                  <pre>
{`-- Preview from schema.sql:
CREATE TABLE public.subjects (...);
CREATE TABLE public.questions (...);
CREATE TABLE public.attempts (...);
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view subjects" ...`}
                  </pre>
                </div>

                <a
                  href="/api/questions/export"
                  download="backup.json"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Complete JSON Backup</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* SUBJECT CREATE / EDIT MODAL                               */}
      {/* ========================================================= */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingSubject ? 'Edit Subject' : 'Create New Subject'}
              </h3>
              <button
                type="button"
                onClick={() => setShowSubjectModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Subject Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics: Differential Calculus"
                  value={subjectForm.title}
                  onChange={(e) => setSubjectForm({ ...subjectForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Subject Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Comprehensive description of the syllabus, topics covered, and target audience."
                  value={subjectForm.description}
                  onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Time Limit (Minutes) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    required
                    value={subjectForm.time_limit}
                    onChange={(e) => setSubjectForm({ ...subjectForm, time_limit: parseInt(e.target.value, 10) || 15 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Passing Score (%) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={subjectForm.passing_score}
                    onChange={(e) => setSubjectForm({ ...subjectForm, passing_score: parseFloat(e.target.value) || 60 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* Negative marking toggle */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={subjectForm.negative_marking}
                    onChange={(e) => setSubjectForm({ ...subjectForm, negative_marking: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Enable Negative Marking for Wrong Answers</span>
                </label>

                {subjectForm.negative_marking && (
                  <div className="pt-2 pl-6">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Penalty Per Wrong Answer (e.g. 0.25, 0.5)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="2"
                      value={subjectForm.negative_mark_value}
                      onChange={(e) => setSubjectForm({ ...subjectForm, negative_mark_value: parseFloat(e.target.value) || 0.25 })}
                      className="w-32 px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs"
                >
                  {editingSubject ? 'Save Changes' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* QUESTION CREATE / EDIT MODAL                              */}
      {/* ========================================================= */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingQuestion ? 'Edit MCQ' : 'Add New 4-Option MCQ'}
              </h3>
              <button
                type="button"
                onClick={() => setShowQuestionModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Question Text (Supports code blocks with ```javascript ... ``` or basic formatting) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. What is the output of the following function?\n\n```javascript\nconsole.log(typeof null);\n```"
                  value={questionForm.question_text}
                  onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* 4 Options */}
              <div className="space-y-3">
                {(['A', 'B', 'C', 'D'] as OptionKey[]).map((opt) => {
                  const key = `option_${opt.toLowerCase()}` as keyof typeof questionForm;
                  return (
                    <div key={opt} className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-slate-100 font-bold text-slate-700 flex items-center justify-center text-xs shrink-0">
                        {opt}
                      </span>
                      <input
                        type="text"
                        required
                        placeholder={`Option ${opt} text`}
                        value={questionForm[key] as string}
                        onChange={(e) => setQuestionForm({ ...questionForm, [key]: e.target.value })}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Correct Option Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Select Correct Answer <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['A', 'B', 'C', 'D'] as OptionKey[]).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setQuestionForm({ ...questionForm, correct_option: opt })}
                      className={`py-2 rounded-xl font-bold text-xs border transition-all ${
                        questionForm.correct_option === opt
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-600/30'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Option {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Detailed Explanation */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Detailed Explanation (Displayed to students after submission)
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain why this option is correct and point out common misconceptions."
                  value={questionForm.explanation}
                  onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs"
                >
                  {editingQuestion ? 'Update Question' : 'Save Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}