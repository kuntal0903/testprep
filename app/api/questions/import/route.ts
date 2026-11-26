import { NextRequest, NextResponse } from 'next/server';
import { bulkImportQuestions, getSubjectById, createSubject, getSubjects } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';
import { OptionKey } from '@/types';

interface NormalizedQuestion {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: OptionKey;
  explanation?: string;
}

function normalizeQuestion(item: unknown): NormalizedQuestion | null {
  if (!item || typeof item !== 'object') return null;
  const q = item as Record<string, unknown>;

  // 1. Question Text
  const question_text = String(
    q.question_text ||
    q.question ||
    q.prompt ||
    q.title ||
    q.q ||
    q.text ||
    ''
  ).trim();

  if (!question_text) return null;

  // 2. Options Extraction
  let optA = '';
  let optB = '';
  let optC = '';
  let optD = '';

  if (Array.isArray(q.options) && q.options.length >= 2) {
    optA = String(q.options[0] ?? '').trim();
    optB = String(q.options[1] ?? '').trim();
    optC = String(q.options[2] ?? '').trim();
    optD = String(q.options[3] ?? '').trim();
  } else if (Array.isArray(q.choices) && q.choices.length >= 2) {
    optA = String(q.choices[0] ?? '').trim();
    optB = String(q.choices[1] ?? '').trim();
    optC = String(q.choices[2] ?? '').trim();
    optD = String(q.choices[3] ?? '').trim();
  } else if (q.options && typeof q.options === 'object') {
    const opts = q.options as Record<string, unknown>;
    optA = String(opts.A || opts.a || opts['1'] || opts.option_a || '').trim();
    optB = String(opts.B || opts.b || opts['2'] || opts.option_b || '').trim();
    optC = String(opts.C || opts.c || opts['3'] || opts.option_c || '').trim();
    optD = String(opts.D || opts.d || opts['4'] || opts.option_d || '').trim();
  } else {
    optA = String(q.option_a || q.optionA || q.a || q.A || q.option1 || q['1'] || '').trim();
    optB = String(q.option_b || q.optionB || q.b || q.B || q.option2 || q['2'] || '').trim();
    optC = String(q.option_c || q.optionC || q.c || q.C || q.option3 || q['3'] || '').trim();
    optD = String(q.option_d || q.optionD || q.d || q.D || q.option4 || q['4'] || '').trim();
  }

  // Fallbacks if only 2 or 3 options are provided
  if (!optA || !optB) return null;
  if (!optC) optC = 'None of the above';
  if (!optD) optD = 'All of the above';

  // 3. Correct Option Extraction
  const rawAnswer = String(
    q.correct_option ??
    q.correctOption ??
    q.correct_answer ??
    q.correctAnswer ??
    q.correct ??
    q.answer ??
    q.ans ??
    q.key ??
    'A'
  ).trim();

  let correct_option: OptionKey = 'A';
  const upperRaw = rawAnswer.toUpperCase();

  if (['A', 'B', 'C', 'D'].includes(upperRaw)) {
    correct_option = upperRaw as OptionKey;
  } else if (['0', '1', '2', '3'].includes(upperRaw)) {
    const map: OptionKey[] = ['A', 'B', 'C', 'D'];
    correct_option = map[parseInt(upperRaw, 10)] || 'A';
  } else if (['1', '2', '3', '4'].includes(upperRaw)) {
    const map: OptionKey[] = ['A', 'B', 'C', 'D'];
    correct_option = map[parseInt(upperRaw, 10) - 1] || 'A';
  } else {
    // Match by option text content
    const cleanRaw = rawAnswer.toLowerCase();
    if (cleanRaw === optA.toLowerCase()) correct_option = 'A';
    else if (cleanRaw === optB.toLowerCase()) correct_option = 'B';
    else if (cleanRaw === optC.toLowerCase()) correct_option = 'C';
    else if (cleanRaw === optD.toLowerCase()) correct_option = 'D';
    else if (upperRaw.startsWith('OPTION A') || upperRaw.startsWith('A)')) correct_option = 'A';
    else if (upperRaw.startsWith('OPTION B') || upperRaw.startsWith('B)')) correct_option = 'B';
    else if (upperRaw.startsWith('OPTION C') || upperRaw.startsWith('C)')) correct_option = 'C';
    else if (upperRaw.startsWith('OPTION D') || upperRaw.startsWith('D)')) correct_option = 'D';
  }

  // 4. Explanation
  const explanation = String(
    q.explanation ||
    q.explain ||
    q.solution ||
    q.reason ||
    q.description ||
    ''
  ).trim();

  return {
    question_text,
    option_a: optA,
    option_b: optB,
    option_c: optC,
    option_d: optD,
    correct_option,
    explanation,
  };
}

function parseCSV(text: string): unknown[] {
  const cleanText = text.replace(/^\uFEFF/, '').trim();
  if (!cleanText) return [];

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField.trim());
      if (currentRow.some((f) => f.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) return [];

  const firstRow = rows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const hasHeader =
    firstRow.some((h) => h.includes('question') || h.includes('prompt')) ||
    firstRow.some((h) => h === 'a' || h.includes('optiona') || h.includes('option1'));

  const startIndex = hasHeader ? 1 : 0;
  const headerMap: Record<string, number> = {};

  if (hasHeader) {
    firstRow.forEach((col, idx) => {
      headerMap[col] = idx;
    });
  }

  const results: unknown[] = [];
  for (let r = startIndex; r < rows.length; r++) {
    const row = rows[r];
    if (row.length < 2) continue;

    const getCol = (possibleNames: string[], defaultIdx: number): string => {
      if (hasHeader) {
        for (const name of possibleNames) {
          if (headerMap[name] !== undefined && row[headerMap[name]] !== undefined) {
            return row[headerMap[name]];
          }
        }
      }
      return row[defaultIdx] || '';
    };

    results.push({
      question_text: getCol(['questiontext', 'question', 'prompt', 'q'], 0),
      option_a: getCol(['optiona', 'option1', 'a', 'choicea'], 1),
      option_b: getCol(['optionb', 'option2', 'b', 'choiceb'], 2),
      option_c: getCol(['optionc', 'option3', 'c', 'choicec'], 3),
      option_d: getCol(['optiond', 'option4', 'd', 'choiced'], 4),
      correct_option: getCol(['correctoption', 'correctanswer', 'correct', 'answer', 'ans', 'key'], 5),
      explanation: getCol(['explanation', 'explain', 'solution', 'reason', 'notes'], 6),
    });
  }

  return results;
}

export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    let subjectId = '';
    let candidateQuestions: unknown[] = [];
    let fileMetadataSubject: {
      title?: string;
      description?: string;
      time_limit?: number;
      passing_score?: number;
      negative_marking?: boolean;
      negative_mark_value?: number;
    } | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      subjectId = ((formData.get('subject_id') as string) || '').trim();
      const newSubjectTitle = ((formData.get('new_subject_title') as string) || '').trim();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'Please choose a .json or .csv file to upload.' }, { status: 400 });
      }

      const fileText = await file.text();
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.json')) {
        try {
          const parsed = JSON.parse(fileText);
          if (Array.isArray(parsed)) {
            candidateQuestions = parsed;
          } else if (parsed && typeof parsed === 'object') {
            if (Array.isArray(parsed.questions)) {
              candidateQuestions = parsed.questions;
            } else if (Array.isArray(parsed.data)) {
              candidateQuestions = parsed.data;
            }
            if (parsed.subject && typeof parsed.subject === 'object') {
              fileMetadataSubject = parsed.subject;
            }
          }
        } catch {
          return NextResponse.json({ error: 'Invalid JSON file: Failed to parse syntax.' }, { status: 400 });
        }
      } else if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
        candidateQuestions = parseCSV(fileText);
      } else {
        // Attempt JSON first, then CSV
        try {
          const parsed = JSON.parse(fileText);
          candidateQuestions = Array.isArray(parsed) ? parsed : parsed.questions || [];
        } catch {
          candidateQuestions = parseCSV(fileText);
        }
      }

      // If user typed a new subject name in the form
      if (newSubjectTitle && (!subjectId || subjectId === 'new')) {
        fileMetadataSubject = {
          title: newSubjectTitle,
          description: ((formData.get('new_subject_description') as string) || '').trim(),
          time_limit: parseInt((formData.get('new_subject_time_limit') as string) || '15', 10),
          passing_score: parseFloat((formData.get('new_subject_passing_score') as string) || '60'),
        };
      }
    } else {
      const body = await request.json();
      subjectId = (body.subject_id || '').trim();
      if (body.csv_text) {
        candidateQuestions = parseCSV(body.csv_text);
      } else if (Array.isArray(body.questions)) {
        candidateQuestions = body.questions;
      }
      if (body.new_subject && typeof body.new_subject === 'object') {
        fileMetadataSubject = body.new_subject;
      }
    }

    // Auto-create subject if requested or if no subject exists and file provided subject metadata
    if ((!subjectId || subjectId === 'new' || subjectId === 'auto_create') && fileMetadataSubject?.title) {
      const created = await createSubject({
        title: fileMetadataSubject.title.trim(),
        description: fileMetadataSubject.description?.trim() || '',
        time_limit: Math.max(1, fileMetadataSubject.time_limit || 15),
        passing_score: Math.min(100, Math.max(1, fileMetadataSubject.passing_score || 60)),
        negative_marking: Boolean(fileMetadataSubject.negative_marking),
        negative_mark_value: Math.max(0, fileMetadataSubject.negative_mark_value || 0.25),
      });
      subjectId = created.id;
    }

    // If still no subjectId, pick the first existing subject or ask to create one
    if (!subjectId) {
      const allSubjects = await getSubjects();
      if (allSubjects.length > 0) {
        subjectId = allSubjects[0].id;
      } else {
        return NextResponse.json(
          { error: 'No subjects exist yet. Please create a subject first before importing questions.' },
          { status: 400 }
        );
      }
    }

    const targetSubject = await getSubjectById(subjectId);
    if (!targetSubject) {
      return NextResponse.json({ error: `Subject with ID "${subjectId}" was not found.` }, { status: 404 });
    }

    // Normalize and filter valid questions
    const validQuestions: NormalizedQuestion[] = [];
    for (const item of candidateQuestions) {
      const norm = normalizeQuestion(item);
      if (norm) {
        validQuestions.push(norm);
      }
    }

    if (validQuestions.length === 0) {
      return NextResponse.json(
        {
          error:
            'No valid questions could be recognized from the input. Ensure your file contains question text and at least 2 options (A & B).',
        },
        { status: 400 }
      );
    }

    const importedCount = await bulkImportQuestions(
      subjectId,
      validQuestions.map((q) => ({
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_option: q.correct_option,
        explanation: q.explanation,
      }))
    );

    return NextResponse.json({
      success: true,
      count: importedCount,
      subject_id: subjectId,
      subject_title: targetSubject.title,
      sample_question: validQuestions[0].question_text,
      message: `Successfully imported ${importedCount} questions into "${targetSubject.title}".`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Import failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}