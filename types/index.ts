export type OptionKey = 'A' | 'B' | 'C' | 'D';

export interface Subject {
  id: string;
  title: string;
  description: string;
  time_limit: number;
  negative_marking: boolean;
  negative_mark_value: number;
  passing_score: number;
  question_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  subject_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: OptionKey;
  explanation: string;
  created_at: string;
  updated_at: string;
}

export interface PublicQuestion {
  id: string;
  subject_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
}

export interface QuestionSubmission {
  question_id: string;
  selected_option: OptionKey | null;
}

export interface QuestionReviewItem {
  question_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  selected_option: OptionKey | null;
  correct_option: OptionKey;
  is_correct: boolean;
  explanation: string;
  marks_awarded: number;
}

export interface Attempt {
  id: string;
  subject_id: string;
  subject_title: string;
  student_name: string;
  roll_no?: string;
  total_questions: number;
  answered_count: number;
  correct_count: number;
  incorrect_count: number;
  unanswered_count: number;
  score: number;
  percentage: number;
  time_taken_seconds: number;
  passed: boolean;
  rank?: number;
  answers: QuestionReviewItem[];
  created_at: string;
}

export interface LeaderboardEntry {
  id: string;
  subject_id: string;
  subject_title: string;
  student_name: string;
  roll_no?: string;
  score: number;
  percentage: number;
  total_questions: number;
  correct_count: number;
  time_taken_seconds: number;
  passed: boolean;
  rank: number;
  created_at: string;
}

export interface AdminStats {
  total_subjects: number;
  total_questions: number;
  total_attempts: number;
  average_score: number;
  pass_rate: number;
}