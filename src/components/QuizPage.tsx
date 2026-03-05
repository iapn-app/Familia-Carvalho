import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { GameState, getGameState, updateGameState, resetGameState } from "../lib/storage";
import { supabase } from "../services/supabaseClient";
import { REFILL_POLICY } from "../lib/refillPolicy";

const TIMER_SECONDS = 15;

export default function QuizPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<GameState>(getGameState());
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showStreakBoost, setShowStreakBoost] = useState(false);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [isTimeOut, setIsTimeOut] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      setErrorMsg(null);

      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        setErrorMsg("Supabase não configurado.");
        setLoading(false);
        return;
      }

      try {
        const book = "Gênesis";
        const stage = "Criação";
        const level = "basic";

        // 1. Check count of approved questions
        const { count: approvedCount } = await supabase
          .from("questions")
          .select("*", { count: "exact", head: true })
          .eq("book", book)
          .eq("stage", stage)
          .eq("level", level)
          .eq("status", "approved");
        
        if ((approvedCount || 0) < REFILL_POLICY.MIN_APPROVED) {
          fetch("/api/refill", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ book, stage, level, autoApprove: false }),
          }).catch(err => console.error("Refill trigger failed", err));
        }

        // 2. Fetch questions excluding seen ones
        let query = supabase
          .from("questions")
          .select("id,book,stage,level,difficulty,question,options,correct_answer,explanation,status")
          .eq("status", "approved")
          .eq("book", book)
          .eq("stage", stage)
          .eq("level", level);

        const seenIds = state.seenQuestionIds || [];
        if (seenIds.length > 0) {
          query = query.not("id", "in", `(${seenIds.join(",")})`);
        }

        const { data, error } = await query.limit(5);

        if (error) throw error;
        setQuestions(data || []);
      } catch (error: any) {
        console.error("Unexpected error:", error);
        setErrorMsg(error.message || "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();

    if (state.isGameOver) {
      const newState = resetGameState();
      setState(newState);
    }
  }, [navigate]);

  // Timer Logic
  useEffect(() => {
    if (loading || questions.length === 0 || selectedOption !== null || isTimeOut) return;

    setTimeLeft(TIMER_SECONDS);
    setIsTimeOut(false);
    startTimeRef.current = Date.now();

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = Math.max(0, TIMER_SECONDS - elapsed);
      
      setTimeLeft(remaining);

      if (remaining <= 0) {
        handleTimeout();
      }
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.currentQuestionIndex, loading, questions.length]);

  const handleTimeout = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsTimeOut(true);
    setFeedback("wrong");
    
    const currentQuestion = questions[state.currentQuestionIndex];
    if (!currentQuestion) return;

    // Update state (lose life)
    const newLives = state.lives - 1;
    const newState = updateGameState({
      lives: newLives,
      streak: 0,
      wrongAnswers: state.wrongAnswers + 1,
      seenQuestionIds: [...(state.seenQuestionIds || []), currentQuestion.id]
    });
    setState(newState);

    setTimeout(() => {
      advanceQuestion(newLives);
    }, 900);
  };

  const fetchMoreQuestions = async () => {
    try {
      const currentState = getGameState();
      const book = "Gênesis";
      const stage = "Criação";
      const level = "basic";

      let query = supabase
        .from("questions")
        .select("id,book,stage,level,difficulty,question,options,correct_answer,explanation,status")
        .eq("status", "approved")
        .eq("book", book)
        .eq("stage", stage)
        .eq("level", level);

      const seenIds = currentState.seenQuestionIds || [];
      if (seenIds.length > 0) {
        query = query.not("id", "in", `(${seenIds.join(",")})`);
      }

      const { data, error } = await query.limit(5);

      if (error) throw error;
      if (data && data.length > 0) {
        setQuestions(prev => {
          const newQuestions = data.filter(d => !prev.some(p => p.id === d.id));
          return [...prev, ...newQuestions];
        });
      }
    } catch (error: any) {
      console.error("Error fetching more questions:", error);
    }
  };

  const advanceQuestion = (currentLives: number) => {
    if (currentLives <= 0) {
      updateGameState({ isGameOver: true });
      navigate("/resultado");
    } else {
      const nextIndex = state.currentQuestionIndex + 1;
      const nextState = updateGameState({
        currentQuestionIndex: nextIndex,
      });
      setState(nextState);
      setSelectedOption(null);
      setFeedback(null);
      setIsTimeOut(false);
      
      if (nextIndex >= questions.length - 2) {
        fetchMoreQuestions();
      }
    }
  };

  const handleSkip = () => {
    if (state.skips_left <= 0 || selectedOption !== null || isTimeOut) return;
    
    if (timerRef.current) clearInterval(timerRef.current);
    
    const currentQuestion = questions[state.currentQuestionIndex];
    const newState = updateGameState({
      skips_left: state.skips_left - 1,
      seenQuestionIds: [...(state.seenQuestionIds || []), currentQuestion.id]
    });
    setState(newState);
    
    advanceQuestion(state.lives);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0B1F4B] text-white p-6 flex flex-col items-center justify-center font-manrope">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-400"></div>
        <p className="mt-4 text-white/60 font-medium">Preparando seu desafio...</p>
      </main>
    );
  }

  if (errorMsg) {
    return (
      <main className="min-h-screen bg-[#0B1F4B] text-white p-6 flex flex-col items-center justify-center text-center font-manrope">
        <p className="text-red-400 text-xl mb-4 font-bold">Ops! Algo deu errado.</p>
        <p className="text-white/60 mb-8">{errorMsg}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-8 py-4 bg-amber-400 text-blue-950 rounded-2xl font-extrabold hover:bg-amber-300 transition-all shadow-lg"
        >
          Tentar novamente
        </button>
      </main>
    );
  }

  if (questions.length === 0) {
    return (
      <main className="min-h-screen bg-[#0B1F4B] text-white p-6 flex flex-col items-center justify-center text-center font-manrope">
        <div className="text-6xl mb-6">📖</div>
        <p className="text-white/80 text-2xl mb-2 font-extrabold">Sem perguntas novas!</p>
        <p className="text-white/50 mb-8 max-w-xs">Você já viu todas as perguntas aprovadas desta categoria.</p>
        <button 
          onClick={() => navigate("/home")} 
          className="px-8 py-4 bg-white/10 text-white rounded-2xl font-extrabold hover:bg-white/20 transition-all border border-white/10"
        >
          Voltar para Home
        </button>
      </main>
    );
  }

  const currentQuestion = questions[state.currentQuestionIndex];

  if (!currentQuestion) {
    if (state.currentQuestionIndex >= questions.length) {
      return (
        <main className="min-h-screen bg-[#0B1F4B] text-white p-6 flex flex-col items-center justify-center font-manrope">
          <div className="animate-pulse text-amber-400 text-xl font-bold">Finalizando rodada...</div>
        </main>
      );
    }
    return (
      <main className="min-h-screen bg-[#0B1F4B] text-white p-6 flex flex-col items-center justify-center font-manrope">
        <p className="text-white/60">Erro ao carregar pergunta.</p>
        <button onClick={() => navigate("/home")} className="mt-4 px-6 py-3 bg-amber-400 text-blue-950 rounded-xl font-bold">Voltar</button>
      </main>
    );
  }

  const handleOptionClick = (option: string) => {
    if (selectedOption !== null || isTimeOut) return;
    
    if (timerRef.current) clearInterval(timerRef.current);
    
    setSelectedOption(option);

    const isCorrect = option === currentQuestion.correct_answer;
    setFeedback(isCorrect ? "correct" : "wrong");

    if (isCorrect) {
      confetti({
        particleCount: 40,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#FFD86B", "#FFFFFF", "#FBBF24"]
      });
    }

    // Update state
    let newLives = state.lives;
    let newStreak = state.streak;
    let newScore = state.score;
    let newCoins = state.coins;
    let newCorrect = state.correctAnswers;
    let newWrong = state.wrongAnswers;
    const currentSeenIds = state.seenQuestionIds || [];
    const newSeenIds = [...currentSeenIds, currentQuestion.id];

    if (isCorrect) {
      newScore += 100 + newStreak * 10;
      newCoins += 10;
      newStreak += 1;
      newCorrect += 1;

      // Streak Boost every 5
      if (newStreak > 0 && newStreak % 5 === 0) {
        newCoins += 30;
        setShowStreakBoost(true);
        setTimeout(() => setShowStreakBoost(false), 2000);
      }
    } else {
      newLives -= 1;
      newStreak = 0;
      newWrong += 1;
    }

    const newState = updateGameState({
      lives: newLives,
      streak: newStreak,
      score: newScore,
      coins: newCoins,
      correctAnswers: newCorrect,
      wrongAnswers: newWrong,
      seenQuestionIds: newSeenIds
    });
    setState(newState);

    // Auto-advance after 0.9s
    setTimeout(() => {
      advanceQuestion(newLives);
    }, 900);
  };

  return (
    <main className="min-h-screen bg-[#0B1F4B] text-white p-6 flex flex-col font-manrope">
      {/* Top Bar */}
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/5">
            <span className="text-red-400">❤️</span>
            <span className="font-extrabold">{state.lives}</span>
          </div>
          <div className="bg-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/5">
            <span className="text-amber-400">🪙</span>
            <span className="font-extrabold">{state.coins}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSkip}
            disabled={state.skips_left <= 0 || selectedOption !== null || isTimeOut}
            className={`px-4 py-1.5 rounded-full font-extrabold text-sm transition-all border ${
              state.skips_left > 0 
                ? "bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30" 
                : "bg-white/5 border-white/5 text-white/30 cursor-not-allowed"
            }`}
          >
            {state.skips_left > 0 ? `Pular (${state.skips_left})` : "Sem pulos"}
          </button>
          
          <div className="flex items-center gap-1.5 bg-orange-500/20 px-4 py-1.5 rounded-full border border-orange-500/30">
            <span className="text-orange-400">🔥</span>
            <span className="font-extrabold text-orange-400">{state.streak}</span>
          </div>
        </div>
      </header>

      {/* Progress & Timer */}
      <div className="flex flex-col gap-2 mb-10">
        <div className="flex justify-between items-center px-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/30">
            Pergunta {state.currentQuestionIndex + 1}
          </span>
          <div className={`flex items-center gap-1.5 ${timeLeft <= 5 ? "text-red-400 animate-pulse" : "text-amber-400"}`}>
            <span className="text-xs font-black">⏱️ {timeLeft}s</span>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <motion.div 
          key={state.currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl mb-8 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-white/5" />
          <p className="text-xl md:text-2xl text-center leading-relaxed font-bold">
            {currentQuestion.question}
          </p>
          
          {isTimeOut && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 text-center"
            >
              <span className="bg-red-500/20 text-red-400 px-4 py-2 rounded-full font-black text-sm border border-red-500/30">
                ⏰ Tempo esgotado
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Options */}
        <div className="space-y-3.5">
          {currentQuestion.options.map((option: string, index: number) => {
            const isCorrect = option === currentQuestion.correct_answer;
            const isSelected = option === selectedOption;
            
            let buttonStyle = "bg-white/5 border-white/10 text-white";
            if (selectedOption !== null || isTimeOut) {
              if (isCorrect) buttonStyle = "bg-green-500 border-green-400 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)]";
              else if (isSelected) buttonStyle = "bg-red-500 border-red-400 text-white";
              else buttonStyle = "bg-white/5 border-white/5 opacity-30";
            }

            return (
              <motion.button
                key={index}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleOptionClick(option)}
                disabled={selectedOption !== null || isTimeOut}
                className={`w-full p-5 rounded-2xl border-2 text-left transition-all font-bold text-lg flex items-center justify-between ${buttonStyle}`}
              >
                <span>{option}</span>
                {(selectedOption !== null || isTimeOut) && isCorrect && <span>✅</span>}
                {selectedOption !== null && isSelected && !isCorrect && <span>❌</span>}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Streak Boost Overlay */}
      <AnimatePresence>
        {showStreakBoost && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
          >
            <div className="bg-orange-500 text-white px-8 py-4 rounded-3xl shadow-[0_0_50px_rgba(249,115,22,0.5)] flex flex-col items-center">
              <span className="text-5xl mb-2">🔥</span>
              <span className="text-2xl font-black uppercase tracking-tighter">Sequência {state.streak}!</span>
              <span className="text-sm font-bold opacity-80">+30 Moedas</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
