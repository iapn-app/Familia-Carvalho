import { supabase } from "./supabaseClient";
import { updateGameState, getGameState } from "../lib/storage";

export interface UserStats {
  user_id: string;
  streak_days: number;
  last_played_date: string;
  badges: string[];
}

export const streakService = {
  async updateStreak(userId: string) {
    if (!userId) return null;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    try {
      // 1. Fetch current stats
      const { data: stats, error } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", userId)
        .single();

      let newStreak = 1;
      let currentBadges: string[] = stats?.badges || [];
      let rewards: { lives?: number; coins?: number; badge?: string } = {};

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching user stats:", error);
        return null;
      }

      if (stats) {
        if (stats.last_played_date === today) {
          // Already played today, no streak update needed
          return stats;
        } else if (stats.last_played_date === yesterday) {
          // Played yesterday, increment streak
          newStreak = stats.streak_days + 1;
        } else {
          // Missed a day, reset streak
          newStreak = 1;
        }
      }

      // 2. Check for rewards
      if (newStreak === 3) {
        rewards.lives = 1;
      } else if (newStreak === 5) {
        rewards.coins = 10;
      } else if (newStreak === 7 && !currentBadges.includes("Persistente")) {
        currentBadges.push("Persistente");
        rewards.badge = "Persistente";
      } else if (newStreak === 30 && !currentBadges.includes("Discípulo")) {
        currentBadges.push("Discípulo");
        rewards.badge = "Discípulo";
      }

      // 3. Apply rewards to local GameState if any
      if (rewards.lives || rewards.coins) {
        const currentGameState = getGameState();
        updateGameState({
          lives: currentGameState.lives + (rewards.lives || 0),
          coins: currentGameState.coins + (rewards.coins || 0)
        });
      }

      // 4. Update Supabase
      const { data: updatedStats, error: upsertError } = await supabase
        .from("user_stats")
        .upsert({
          user_id: userId,
          streak_days: newStreak,
          last_played_date: today,
          badges: currentBadges
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (upsertError) throw upsertError;

      // Also update local GameState streak for immediate UI feedback
      updateGameState({ streak: newStreak });

      return { ...updatedStats, rewards };
    } catch (err) {
      console.error("Error in updateStreak:", err);
      return null;
    }
  },

  async getStats(userId: string): Promise<UserStats | null> {
    if (!userId) return null;
    try {
      const { data, error } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null;
        throw error;
      }
      return data;
    } catch (err) {
      console.error("Error fetching user stats:", err);
      return null;
    }
  }
};
