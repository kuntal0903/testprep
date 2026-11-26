import fs from 'fs';
import path from 'path';
import { Subject, Question, Attempt, LeaderboardEntry, AdminStats } from '@/types';
import { isSupabaseConfigured, supabaseAdmin } from './supabase';

interface StoreData {
  subjects: Subject[];
  questions: Question[];
  attempts: Attempt[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

// Ensure data folder and store file exist
function getLocalStore(): StoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_FILE)) {
      const initialData: StoreData = {
        subjects: [],
        questions: [],
        attempts: [],
      };
      fs.writeFileSync(STORE_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      return initialData;
    }
    const content = fs.readFileSync(STORE_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    return {
      subjects: Array.isArray(parsed.subjects) ? parsed.subjects : [],
      questions: Array.isArray(parsed.questions) ? parsed.questions : [],
      attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
    };
  } catch (err) {
    console.error('Error reading local store:', err);
    return {
      subjects: [],
      questions: [],
      attempts: [],
    };
  }
}

function saveLocalStore(data: StoreData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving local store:', err);
  }
}

// ==========================================
// SUBJECTS
// ==========================================
export async function getSubjects(): Promise<Subject[]> {
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data: subjects, error } = await supabaseAdmin
        .from('subjects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get question count per subject
      const { data: questions } = await supabaseAdmin.from('questions').select('subject_id');
      const counts: Record<string, number> = {};
      questions?.forEach((q) => {
        counts[q.subject_id] = (counts[q.subject_id] || 0) + 1;
      });

      return (subjects || []).map((s) => ({
        ...s,
        question_count: counts[s.id] || 0,
      }));
    } catch (err) {
      console.warn('Supabase query failed, falling back to local store:', err);
    }
  }

  const store = getLocalStore();
  return store.subjects.map((sub) => ({
    ...sub,
    question_count: store.questions.filter((q) => q.subject_id === sub.id).length,
  }));
}

export async function getSubjectById(id: string): Promise<Subject | null> {
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('subjects')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) {
        const { count } = await supabaseAdmin
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('subject_id', id);
        return { ...data, question_count: count || 0 };
      }
    } catch (err) {
      console.warn('Supabase query failed, falling back to local store:', err);
    }
  }

  const store = getLocalStore();
  const found = store.subjects.find((s) => s.id === id);
  if (!found) return null;
  return {
    ...found,
    question_count: store.questions.filter((q) => q.subject_id === found.id).length,
  };
}

export async function createSubject(input: Partial<Subject>): Promise<Subject> {
  const newSubject: Subject = {
    id: input.id || `sub-${Date.now().toString(36)}`,
    title: input.title || 'Untitled Subject',
    description: input.description || '',
    time_limit: Number(input.time_limit) || 15,
    negative_marking: Boolean(input.negative_marking),
    negative_mark_value: Number(input.negative_mark_value) || 0.25,
    passing_score: Number(input.passing_score) || 60,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('subjects')
        .insert([newSubject])
        .select()
        .single();
      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase insert failed, using local store:', err);
    }
  }

  const store = getLocalStore();
  store.subjects.unshift(newSubject);
  saveLocalStore(store);
  return { ...newSubject, question_count: 0 };
}

export async function updateSubject(id: string, input: Partial<Subject>): Promise<Subject | null> {
  const updateData = {
    ...input,
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('subjects')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase update failed, using local store:', err);
    }
  }

  const store = getLocalStore();
  const index = store.subjects.findIndex((s) => s.id === id);
  if (index === -1) return null;

  store.subjects[index] = {
    ...store.subjects[index],
    ...updateData,
  };
  saveLocalStore(store);
  return {
    ...store.subjects[index],
    question_count: store.questions.filter((q) => q.subject_id === id).length,
  };
}

export async function deleteSubject(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin.from('subjects').delete().eq('id', id);
      if (!error) return true;
    } catch (err) {
      console.warn('Supabase delete failed, using local store:', err);
    }
  }

  const store = getLocalStore();
  store.subjects = store.subjects.filter((s) => s.id !== id);
  store.questions = store.questions.filter((q) => q.subject_id !== id);
  store.attempts = store.attempts.filter((a) => a.subject_id !== id);
  saveLocalStore(store);
  return true;
}

// ==========================================
// QUESTIONS
// ==========================================
export async function getQuestionsBySubject(subjectId: string): Promise<Question[]> {
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('questions')
        .select('*')
        .eq('subject_id', subjectId)
        .order('created_at', { ascending: true });
      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase question query failed, using local store:', err);
    }
  }

  const store = getLocalStore();
  return store.questions.filter((q) => q.subject_id === subjectId);
}

export async function getQuestionById(id: string): Promise<Question | null> {
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('questions')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase getQuestionById failed:', err);
    }
  }

  const store = getLocalStore();
  return store.questions.find((q) => q.id === id) || null;
}

export async function createQuestion(input: Partial<Question>): Promise<Question> {
  const newQuestion: Question = {
    id: input.id || `q-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    subject_id: input.subject_id || '',
    question_text: input.question_text || '',
    option_a: input.option_a || '',
    option_b: input.option_b || '',
    option_c: input.option_c || '',
    option_d: input.option_d || '',
    correct_option: input.correct_option || 'A',
    explanation: input.explanation || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('questions')
        .insert([newQuestion])
        .select()
        .single();
      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase createQuestion failed, using local store:', err);
    }
  }

  const store = getLocalStore();
  store.questions.push(newQuestion);
  saveLocalStore(store);
  return newQuestion;
}

export async function updateQuestion(id: string, input: Partial<Question>): Promise<Question | null> {
  const updateData = {
    ...input,
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('questions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase updateQuestion failed, using local store:', err);
    }
  }

  const store = getLocalStore();
  const index = store.questions.findIndex((q) => q.id === id);
  if (index === -1) return null;

  store.questions[index] = {
    ...store.questions[index],
    ...updateData,
  };
  saveLocalStore(store);
  return store.questions[index];
}

export async function deleteQuestion(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin.from('questions').delete().eq('id', id);
      if (!error) return true;
    } catch (err) {
      console.warn('Supabase deleteQuestion failed, using local store:', err);
    }
  }

  const store = getLocalStore();
  store.questions = store.questions.filter((q) => q.id !== id);
  saveLocalStore(store);
  return true;
}

export async function bulkImportQuestions(
  subjectId: string,
  rawQuestions: Array<{
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_option: string;
    explanation?: string;
  }>
): Promise<number> {
  const formatted: Question[] = rawQuestions.map((q, idx) => ({
    id: `q-bulk-${Date.now().toString(36)}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
    subject_id: subjectId,
    question_text: q.question_text || '',
    option_a: q.option_a || '',
    option_b: q.option_b || '',
    option_c: q.option_c || '',
    option_d: q.option_d || '',
    correct_option: (['A', 'B', 'C', 'D'].includes(q.correct_option?.toUpperCase())
      ? q.correct_option.toUpperCase()
      : 'A') as 'A' | 'B' | 'C' | 'D',
    explanation: q.explanation || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin.from('questions').insert(formatted).select();
      if (!error && data) return data.length;
    } catch (err) {
      console.warn('Supabase bulkImport failed, using local store:', err);
    }
  }

  const store = getLocalStore();
  store.questions.push(...formatted);
  saveLocalStore(store);
  return formatted.length;
}

// ==========================================
// ATTEMPTS & LEADERBOARD
// ==========================================
export async function saveAttempt(input: Omit<Attempt, 'id' | 'created_at'>): Promise<Attempt> {
  const newAttempt: Attempt = {
    id: `att-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    ...input,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('attempts')
        .insert([newAttempt])
        .select()
        .single();
      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase saveAttempt failed, using local store:', err);
    }
  }

  const store = getLocalStore();
  store.attempts.unshift(newAttempt);
  saveLocalStore(store);
  return newAttempt;
}

export async function getAttempts(subjectId?: string): Promise<Attempt[]> {
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      let query = supabaseAdmin.from('attempts').select('*');
      if (subjectId && subjectId !== 'all') {
        query = query.eq('subject_id', subjectId);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase getAttempts failed, using local store:', err);
    }
  }

  const store = getLocalStore();
  if (subjectId && subjectId !== 'all') {
    return store.attempts.filter((a) => a.subject_id === subjectId);
  }
  return [...store.attempts].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function getLeaderboard(subjectId?: string): Promise<LeaderboardEntry[]> {
  let attempts: Attempt[] = [];

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      let query = supabaseAdmin.from('attempts').select('*');
      if (subjectId && subjectId !== 'all') {
        query = query.eq('subject_id', subjectId);
      }
      // Highest score first, then fastest time taken
      const { data, error } = await query
        .order('score', { ascending: false })
        .order('time_taken_seconds', { ascending: true });
      if (!error && data) attempts = data;
    } catch (err) {
      console.warn('Supabase getLeaderboard failed, using local store:', err);
    }
  }

  if (attempts.length === 0) {
    const store = getLocalStore();
    let list = store.attempts;
    if (subjectId && subjectId !== 'all') {
      list = list.filter((a) => a.subject_id === subjectId);
    }
    // Ranking Logic: Highest score (descending), fastest time taken (ascending)
    attempts = [...list].sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.time_taken_seconds - b.time_taken_seconds;
    });
  } else {
    // Ensure strict sorting
    attempts.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.time_taken_seconds - b.time_taken_seconds;
    });
  }

  return attempts.map((att, idx) => ({
    id: att.id,
    subject_id: att.subject_id,
    subject_title: att.subject_title,
    student_name: att.student_name,
    roll_no: att.roll_no,
    score: att.score,
    percentage: att.percentage,
    total_questions: att.total_questions,
    correct_count: att.correct_count,
    time_taken_seconds: att.time_taken_seconds,
    passed: att.passed,
    rank: idx + 1,
    created_at: att.created_at,
  }));
}

export async function deleteAttempt(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin.from('attempts').delete().eq('id', id);
      if (!error) return true;
    } catch (err) {
      console.warn('Supabase deleteAttempt failed, using local store:', err);
    }
  }

  const store = getLocalStore();
  store.attempts = store.attempts.filter((a) => a.id !== id);
  saveLocalStore(store);
  return true;
}

export async function resetSubjectLeaderboard(subjectId: string): Promise<boolean> {
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      let query = supabaseAdmin.from('attempts').delete();
      if (subjectId && subjectId !== 'all') {
        query = query.eq('subject_id', subjectId);
      } else {
        query = query.neq('id', 'placeholder-none');
      }
      const { error } = await query;
      if (!error) return true;
    } catch (err) {
      console.warn('Supabase resetLeaderboard failed, using local store:', err);
    }
  }

  const store = getLocalStore();
  if (subjectId && subjectId !== 'all') {
    store.attempts = store.attempts.filter((a) => a.subject_id !== subjectId);
  } else {
    store.attempts = [];
  }
  saveLocalStore(store);
  return true;
}

// ==========================================
// ADMIN METRICS & EXPORT
// ==========================================
export async function getAdminStats(): Promise<AdminStats> {
  const [subjects, attempts] = await Promise.all([getSubjects(), getAttempts()]);

  let totalQuestions = 0;
  subjects.forEach((s) => {
    totalQuestions += s.question_count || 0;
  });

  const totalAttempts = attempts.length;
  const averageScore = totalAttempts > 0
    ? Number((attempts.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / totalAttempts).toFixed(1))
    : 0;

  const passedAttempts = attempts.filter((a) => a.passed).length;
  const passRate = totalAttempts > 0
    ? Number(((passedAttempts / totalAttempts) * 100).toFixed(1))
    : 0;

  return {
    total_subjects: subjects.length,
    total_questions: totalQuestions,
    total_attempts: totalAttempts,
    average_score: averageScore,
    pass_rate: passRate,
  };
}

export async function exportAllData() {
  const store = getLocalStore();
  return {
    version: '1.0',
    exported_at: new Date().toISOString(),
    subjects: store.subjects,
    questions: store.questions,
  };
}
