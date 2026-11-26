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

-- ============================================================
-- 6. Initial Seed Data (1 Sample Subject + 5 MCQs + 5 Leaderboard Entries)
-- ============================================================

INSERT INTO public.subjects (id, title, description, time_limit, negative_marking, negative_mark_value, passing_score)
VALUES 
    ('sub-web-dev', 'Computer Science: Web Technologies & JavaScript', 'Master core concepts of asynchronous JavaScript, DOM runtime, modern web protocols, and component lifecycle.', 10, true, 0.25, 60.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.questions (id, subject_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
VALUES
    ('q-js-01', 'sub-web-dev', 'What is the logged output order of the following JavaScript snippet?\n\n```javascript\nconsole.log(''1'');\nsetTimeout(() => console.log(''2''), 0);\nPromise.resolve().then(() => console.log(''3''));\nconsole.log(''4'');\n```', '1, 2, 3, 4', '1, 4, 3, 2', '1, 4, 2, 3', '1, 3, 4, 2', 'B', 'Synchronous code runs first (1, then 4). Next, the microtask queue (Promise.then: 3) executes before the macrotask queue (setTimeout: 2). Order: 1, 4, 3, 2.'),
    ('q-js-02', 'sub-web-dev', 'In React 18+, which hook is specifically recommended to synchronize with an external system or subscription outside of the React render cycle?', 'useMemo', 'useCallback', 'useEffect', 'useTransition', 'C', 'useEffect is designed to handle side effects and external system synchronization (timers, subscriptions, DOM mutations, manual network requests) after rendering.'),
    ('q-js-03', 'sub-web-dev', 'Which HTTP request method is defined as idempotent according to the RFC 9110 specification?', 'POST', 'PUT', 'PATCH', 'CONNECT', 'B', 'An idempotent HTTP method produces the same intended server-side state upon multiple identical requests. PUT and DELETE are idempotent; POST is non-idempotent.'),
    ('q-js-04', 'sub-web-dev', 'What is the behavior of the following expression in modern JavaScript?\n\n```javascript\nconst obj = { count: 0 };\nconst val1 = obj.count || 10;\nconst val2 = obj.count ?? 10;\nconsole.log(val1, val2);\n```', '0 0', '10 10', '10 0', '0 10', 'C', 'The logical OR (||) operator checks for falsiness (0 is falsy, evaluating to 10). The nullish coalescing operator (??) only checks for null or undefined, preserving 0.'),
    ('q-js-05', 'sub-web-dev', 'Which CSS property establishes a new stacking context for an element without altering its normal document flow layout?', 'display: block', 'isolation: isolate', 'overflow: hidden', 'margin: 0 auto', 'B', 'Setting "isolation: isolate" creates a new stacking context explicitly without requiring artificial z-index or opacity hacks.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.attempts (id, subject_id, subject_title, student_name, roll_no, total_questions, answered_count, correct_count, incorrect_count, unanswered_count, score, percentage, time_taken_seconds, passed)
VALUES
    ('att-01', 'sub-web-dev', 'Computer Science: Web Technologies & JavaScript', 'Sophia Chen', 'CS-2024-001', 5, 5, 5, 0, 0, 5.00, 100.00, 145, true),
    ('att-02', 'sub-web-dev', 'Computer Science: Web Technologies & JavaScript', 'Marcus Vance', 'CS-2024-042', 5, 5, 5, 0, 0, 5.00, 100.00, 198, true),
    ('att-03', 'sub-web-dev', 'Computer Science: Web Technologies & JavaScript', 'Aarav Sharma', 'CS-2024-019', 5, 5, 4, 1, 0, 3.75, 75.00, 220, true),
    ('att-04', 'sub-web-dev', 'Computer Science: Web Technologies & JavaScript', 'Elena Rostova', 'CS-2024-099', 5, 5, 3, 2, 0, 2.50, 50.00, 240, false),
    ('att-05', 'sub-web-dev', 'Computer Science: Web Technologies & JavaScript', 'David Kim', 'CS-2024-088', 5, 4, 3, 1, 1, 2.75, 55.00, 310, false)
ON CONFLICT (id) DO NOTHING;
