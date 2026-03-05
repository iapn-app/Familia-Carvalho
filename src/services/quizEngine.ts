
import { supabase } from './supabaseClient';

export interface Question {
  id: string;
  book: string;
  stage: string;
  level: string;
  difficulty: number;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

export async function getQuizRound(params: {
  userId: string;
  level: string;
  book: string;
  stage: string;
  count: number;
}): Promise<Question[]> {
  const { userId, level, book, stage, count } = params;

  // 1. Get IDs of questions already answered by this user
  const { data: answeredData, error: answeredError } = await supabase
    .from('user_question_stats')
    .select('question_id')
    .eq('user_id', userId);

  if (answeredError) {
    console.error('Error fetching answered questions:', answeredError);
    return [];
  }

  const answeredIds = answeredData?.map((row) => row.question_id) || [];

  // 2. Fetch new questions excluding answered IDs
  let query = supabase
    .from('questions')
    .select('*')
    .eq('status', 'approved')
    .eq('level', level)
    .eq('book', book)
    .eq('stage', stage);

  if (answeredIds.length > 0) {
    // Supabase doesn't have a direct "not in" for array of UUIDs in JS client easily for large sets,
    // but for MVP this works. For larger sets, a stored procedure is better.
    // Using filter for now.
    query = query.not('id', 'in', `(${answeredIds.join(',')})`);
  }

  // Limit first to get candidate pool, then shuffle client side (or use random order if supported)
  // Since we want random 5 from the available pool, we fetch a bit more and shuffle.
  const { data: questions, error: questionsError } = await query.limit(50);

  if (questionsError) {
    console.error('Error fetching questions:', questionsError);
    return [];
  }

  if (!questions || questions.length === 0) {
    return [];
  }

  // 3. Shuffle and slice
  const shuffled = questions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
