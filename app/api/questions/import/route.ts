import { NextRequest, NextResponse } from 'next/server';
import { bulkImportQuestions, getSubjectById } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';

function parseCSV(text: string) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  // Parse header
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
  const results: Array<{
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_option: string;
    explanation?: string;
  }> = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Simple CSV parser handling quotes
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    if (values.length >= 6) {
      // Map according to header or fallback to standard columns
      const getVal = (name: string, fallbackIdx: number) => {
        const idx = headers.indexOf(name);
        return (idx !== -1 ? values[idx] : values[fallbackIdx]) || '';
      };

      const qText = getVal('question_text', 0) || getVal('question', 0);
      const optA = getVal('option_a', 1) || getVal('a', 1);
      const optB = getVal('option_b', 2) || getVal('b', 2);
      const optC = getVal('option_c', 3) || getVal('c', 3);
      const optD = getVal('option_d', 4) || getVal('d', 4);
      const correct = (getVal('correct_option', 5) || getVal('correct', 5) || 'A').toUpperCase();
      const exp = getVal('explanation', 6);

      if (qText && optA && optB && optC && optD) {
        results.push({
          question_text: qText,
          option_a: optA,
          option_b: optB,
          option_c: optC,
          option_d: optD,
          correct_option: ['A', 'B', 'C', 'D'].includes(correct) ? correct : 'A',
          explanation: exp,
        });
      }
    }
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
    let rawQuestions: Array<{
      question_text: string;
      option_a: string;
      option_b: string;
      option_c: string;
      option_d: string;
      correct_option: string;
      explanation?: string;
    }> = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      subjectId = (formData.get('subject_id') as string) || '';
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }

      const fileText = await file.text();
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.json')) {
        const parsed = JSON.parse(fileText);
        rawQuestions = Array.isArray(parsed) ? parsed : parsed.questions || [];
      } else if (fileName.endsWith('.csv')) {
        rawQuestions = parseCSV(fileText);
      } else {
        return NextResponse.json(
          { error: 'Unsupported file format. Please upload a .json or .csv file.' },
          { status: 400 }
        );
      }
    } else {
      const body = await request.json();
      subjectId = body.subject_id;
      if (body.csv_text) {
        rawQuestions = parseCSV(body.csv_text);
      } else if (Array.isArray(body.questions)) {
        rawQuestions = body.questions;
      }
    }

    if (!subjectId) {
      return NextResponse.json({ error: 'subject_id is required' }, { status: 400 });
    }

    const subject = await getSubjectById(subjectId);
    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    if (!rawQuestions || rawQuestions.length === 0) {
      return NextResponse.json(
        { error: 'No valid questions could be parsed from the input file.' },
        { status: 400 }
      );
    }

    const importedCount = await bulkImportQuestions(subjectId, rawQuestions);

    return NextResponse.json({
      success: true,
      count: importedCount,
      message: `Successfully imported ${importedCount} questions into "${subject.title}"`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Import failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
