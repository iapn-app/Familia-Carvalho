export interface QuestionData {
  book: string;
  stage: string;
  level: string;
  difficulty: number;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

export function validateQuestion(q: any): { valid: boolean; error?: string } {
  if (!q.book || typeof q.book !== 'string') return { valid: false, error: 'Missing or invalid book' };
  if (!q.stage || typeof q.stage !== 'string') return { valid: false, error: 'Missing or invalid stage' };
  if (!q.level || typeof q.level !== 'string') return { valid: false, error: 'Missing or invalid level' };
  
  if (typeof q.difficulty !== 'number' || q.difficulty < 1 || q.difficulty > 3) return { valid: false, error: 'Difficulty must be 1, 2, or 3' };

  if (!q.question || typeof q.question !== 'string') return { valid: false, error: 'Missing or invalid question text' };
  
  if (!Array.isArray(q.options) || q.options.length !== 4) {
    return { valid: false, error: 'Options must be an array of exactly 4 strings' };
  }
  
  // Check for empty strings in options
  if (q.options.some((opt: any) => typeof opt !== 'string' || opt.trim() === '')) {
    return { valid: false, error: 'Options must be non-empty strings' };
  }
  
  if (!q.correct_answer || typeof q.correct_answer !== 'string') {
    return { valid: false, error: 'Missing or invalid correct_answer' };
  }
  
  if (!q.options.includes(q.correct_answer)) {
    return { valid: false, error: 'correct_answer must be one of the options' };
  }
  
  if (!q.explanation || typeof q.explanation !== 'string') {
    return { valid: false, error: 'Missing or invalid explanation' };
  }

  return { valid: true };
}

export function validateQuestionsArray(questions: any[]): { valid: boolean; error?: string; validatedQuestions?: QuestionData[] } {
  if (!Array.isArray(questions)) {
    return { valid: false, error: 'Response is not an array' };
  }

  const validated: QuestionData[] = [];
  for (const q of questions) {
    const result = validateQuestion(q);
    if (!result.valid) {
      return { valid: false, error: `Invalid question found: ${result.error}` };
    }
    validated.push(q as QuestionData);
  }

  return { valid: true, validatedQuestions: validated };
}
