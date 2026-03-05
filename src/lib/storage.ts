export interface GameState {
  lives: number;
  coins: number;
  streak: number;
  score: number;
  currentQuestionIndex: number;
  correctAnswers: number;
  wrongAnswers: number;
  isGameOver: boolean;
  seenQuestionIds: string[];
}

const INITIAL_STATE: GameState = {
  lives: 3,
  coins: 0,
  streak: 0,
  score: 0,
  currentQuestionIndex: 0,
  correctAnswers: 0,
  wrongAnswers: 0,
  isGameOver: false,
  seenQuestionIds: [],
};

const STORAGE_KEY = "fc_quiz_state";

export const getGameState = (): GameState => {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (!stored) return INITIAL_STATE;
  try {
    const parsed = JSON.parse(stored);
    // Merge with INITIAL_STATE to ensure new fields (like seenQuestionIds) exist
    return { ...INITIAL_STATE, ...parsed };
  } catch {
    return INITIAL_STATE;
  }
};

export const saveGameState = (state: GameState) => {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const resetGameState = () => {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STATE));
  return INITIAL_STATE;
};

export const updateGameState = (updates: Partial<GameState>) => {
  const current = getGameState();
  const newState = { ...current, ...updates };
  saveGameState(newState);
  return newState;
};
