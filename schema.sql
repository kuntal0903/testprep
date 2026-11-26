-- ============================================================
-- ONLINE MCQ EXAM & QUIZ PLATFORM - SUPABASE POSTGRESQL SCHEMA
-- ============================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    time_limit INTEGER NOT NULL DEFAULT 15, -- minutes
    negative_marking BOOLEAN NOT NULL DEFAULT false,
    negative_mark_value NUMERIC(4, 2) NOT NULL DEFAULT 0.25,
    passing_score NUMERIC(5, 2) NOT NULL DEFAULT 60.0, -- percentage
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Create Questions Table
CREATE TABLE IF NOT EXISTS public.questions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option CHAR(1) NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
    explanation TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index on subject_id for fast question filtering
CREATE INDEX IF NOT EXISTS idx_questions_subject_id ON public.questions(subject_id);

-- 4. Create Attempts / Leaderboard Table
CREATE TABLE IF NOT EXISTS public.attempts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    subject_title TEXT NOT NULL,
    student_name TEXT NOT NULL,
    roll_no TEXT,
    total_questions INTEGER NOT NULL DEFAULT 0,
    answered_count INTEGER NOT NULL DEFAULT 0,
    correct_count INTEGER NOT NULL DEFAULT 0,
    incorrect_count INTEGER NOT NULL DEFAULT 0,
    unanswered_count INTEGER NOT NULL DEFAULT 0,
    score NUMERIC(6, 2) NOT NULL DEFAULT 0,
    percentage NUMERIC(5, 2) NOT NULL DEFAULT 0,
    time_taken_seconds INTEGER NOT NULL DEFAULT 0,
    passed BOOLEAN NOT NULL DEFAULT false,
    answers JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for ranking queries: Highest score first, then fastest time
CREATE INDEX IF NOT EXISTS idx_attempts_subject_ranking 
    ON public.attempts(subject_id, score DESC, time_taken_seconds ASC);

CREATE INDEX IF NOT EXISTS idx_attempts_overall_ranking 
    ON public.attempts(score DESC, time_taken_seconds ASC);

-- 5. Row Level Security (RLS) Policies
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;

-- Subjects RLS: Anyone can view subjects; Admin / Service role can modify
DROP POLICY IF EXISTS "Public can view subjects" ON public.subjects;
CREATE POLICY "Public can view subjects" ON public.subjects
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can manage subjects" ON public.subjects;
CREATE POLICY "Admin can manage subjects" ON public.subjects
    FOR ALL USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Questions RLS: Anyone can view questions; Admin / Service role can modify
DROP POLICY IF EXISTS "Public can view questions" ON public.questions;
CREATE POLICY "Public can view questions" ON public.questions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can manage questions" ON public.questions;
CREATE POLICY "Admin can manage questions" ON public.questions
    FOR ALL USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Attempts RLS: Anyone can view attempts and submit attempts; Admin / Service role can delete/manage
DROP POLICY IF EXISTS "Public can view attempts" ON public.attempts;
CREATE POLICY "Public can view attempts" ON public.attempts
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert attempts" ON public.attempts;
CREATE POLICY "Public can insert attempts" ON public.attempts
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can delete or update attempts" ON public.attempts;
CREATE POLICY "Admin can delete or update attempts" ON public.attempts
    FOR ALL USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
