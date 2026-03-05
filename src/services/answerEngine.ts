
import { supabase } from './supabaseClient';

export async function ensureProfile(userId: string) {
  const { data, error } = await supabase
    .from('game_profile')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!data && !error) {
    // Create new profile
    await supabase.from('game_profile').insert({
      user_id: userId,
      current_level: 'basic',
      coins: 0,
      lives: 3,
      streak: 0,
    });
  }
}

export async function submitAnswer(params: {
  userId: string;
  questionId: string;
  isCorrect: boolean;
}) {
  const { userId, questionId, isCorrect } = params;

  // Upsert user_question_stats
  const { data: existingStats, error: statsError } = await supabase
    .from('user_question_stats')
    .select('*')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .single();

  let timesSeen = 1;
  let timesCorrect = isCorrect ? 1 : 0;
  let timesWrong = isCorrect ? 0 : 1;

  if (existingStats) {
    timesSeen = existingStats.times_seen + 1;
    timesCorrect = existingStats.times_correct + (isCorrect ? 1 : 0);
    timesWrong = existingStats.times_wrong + (isCorrect ? 0 : 1);
  }

  await supabase.from('user_question_stats').upsert({
    user_id: userId,
    question_id: questionId,
    times_seen: timesSeen,
    times_correct: timesCorrect,
    times_wrong: timesWrong,
    last_seen_at: new Date().toISOString(),
    last_answer_correct: isCorrect,
  });

  // Update game_profile (coins, streak, lives)
  const { data: profile } = await supabase
    .from('game_profile')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (profile) {
    let newCoins = profile.coins;
    let newStreak = profile.streak;
    let newLives = profile.lives;

    if (isCorrect) {
      newCoins += 10;
      newStreak += 1;
    } else {
      newStreak = 0;
      newLives = Math.max(0, newLives - 1);
    }

    await supabase
      .from('game_profile')
      .update({
        coins: newCoins,
        streak: newStreak,
        lives: newLives,
      })
      .eq('user_id', userId);
  }
}
