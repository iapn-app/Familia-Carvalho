"use client";

import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../services/supabaseClient";
import MascotBadge from "./MascotBadge";

const TIMER_SECONDS = 15;

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  verse_ref: string;
  explanation: string;
}

interface Player {
  id: string;
  player_name: string;
  user_id: string;
  score: number;
}

export default function MultiplayerQuizPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState<any>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [isTimeOut, setIsTimeOut] = useState(false);
  const [opponentAnswered, setOpponentAnswered] = useState(false);
  const [firstResponder, setFirstResponder] = useState<string | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("fc_user_id");
    if (id) setUserId(id);

    const fetchQuizData = async () => {
      try {
        // 1. Fetch room
        const { data: roomData, error: roomError } = await supabase
          .from("quiz_rooms")
          .select("*")
          .eq("code", code)
          .single();

        if (roomError || !roomData) throw new Error("Sala não encontrada");
        setRoom(roomData);

        // 2. Fetch players
        const { data: playersData, error: playersError } = await supabase
          .from("room_players")
          .select("*")
          .eq("room_id", roomData.id);

        if (playersError) throw playersError;
        setPlayers(playersData || []);

        // 3. Fetch questions
        const { data: questionsData, error: qError } = await supabase
          .from("questions")
          .select("*")
          .in("id", roomData.question_ids);

        if (qError) throw qError;
        
        // Sort questions based on the order in roomData.question_ids
        const sortedQuestions = roomData.question_ids.map((id: string) => 
          questionsData.find((q: any) => q.id === id)
        ).filter(Boolean);

        setQuestions(sortedQuestions);

        // 4. Realtime subscriptions
        const playersSub = supabase
          .channel(`room_players_quiz_${roomData.id}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "room_players",
              filter: `room_id=eq.${roomData.id}`,
            },
            (payload) => {
              setPlayers((prev) => 
                prev.map((p) => p.id === payload.new.id ? { ...p, ...payload.new } : p)
              );
            }
          )
          .subscribe();

        const answersSub = supabase
          .channel(`room_answers_quiz_${roomData.id}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "room_answers",
              filter: `room_id=eq.${roomData.id}`,
            },
            (payload) => {
              const answer = payload.new;
              if (answer.question_id === sortedQuestions[currentIndex]?.id) {
                if (answer.user_id !== id) {
                  setOpponentAnswered(true);
                }
                
                // Track who answered first
                setFirstResponder((prev) => prev || answer.user_id);
              }
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(playersSub);
          supabase.removeChannel(answersSub);
        };
      } catch (err) {
        console.error(err);
        navigate("/duelo");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [code, navigate]);

  useEffect(() => {
    if (loading || isGameOver) return;

    setTimeLeft(TIMER_SECONDS);
    setIsTimeOut(false);
    setSelectedOption(null);
    setIsCorrect(null);
    setOpponentAnswered(false);
    setFirstResponder(null);

    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, loading]);

  const handleTimeout = () => {
    setIsTimeOut(true);
    submitAnswer(null, false);
    setTimeout(advanceQuestion, 1500);
  };

  const handleOptionClick = (option: string) => {
    if (selectedOption || isTimeOut) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const currentQuestion = questions[currentIndex];
    const correct = option === currentQuestion.correct_option;
    
    setSelectedOption(option);
    setIsCorrect(correct);

    submitAnswer(option, correct);
    setTimeout(advanceQuestion, 1500);
  };

  const submitAnswer = async (option: string | null, correct: boolean) => {
    try {
      const currentQuestion = questions[currentIndex];
      const currentPlayer = players.find((p) => p.user_id === userId);
      if (!currentPlayer) return;

      // 1. Record answer
      await supabase.from("room_answers").insert([{
        room_id: room.id,
        user_id: userId,
        question_id: currentQuestion.id,
        is_correct: correct,
        selected_option: option,
        answered_at: new Date().toISOString()
      }]);

      // 2. Update player score if correct
      if (correct) {
        await supabase
          .from("room_players")
          .update({ score: currentPlayer.score + 10 })
          .eq("id", currentPlayer.id);
      }
    } catch (err) {
      console.error("Error submitting answer:", err);
    }
  };

  const advanceQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      finishGame();
    }
  };

  const finishGame = async () => {
    // Update player status to finished?
    // For now just navigate
    navigate(`/duelo-resultado/${code}`);
  };

  const isGameOver = currentIndex >= questions.length && questions.length > 0;
  const currentQuestion = questions[currentIndex];
  const opponent = players.find((p) => p.user_id !== userId);
  const me = players.find((p) => p.user_id === userId);

  if (loading || !currentQuestion) {
    return (
      <div className="min-h-screen bg-[#0B1F4B] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B1F4B] text-white p-6 flex flex-col items-center font-manrope overflow-hidden">
      {/* Header */}
      <header className="w-full max-w-md flex items-center justify-between mb-8 mt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-black text-amber-400">
            {currentIndex + 1}
          </div>
          <div className="h-2 w-24 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-amber-400"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className={`px-4 py-2 rounded-2xl font-black text-lg shadow-lg transition-colors ${
          timeLeft <= 5 ? "bg-red-500 text-white animate-pulse" : "bg-white/10 text-amber-400"
        }`}>
          {timeLeft}s
        </div>
      </header>

      {/* Scoreboard */}
      <div className="w-full max-w-md grid grid-cols-2 gap-3 mb-8">
        <div className={`bg-white/5 border rounded-2xl p-4 flex items-center justify-between transition-all ${
          selectedOption ? "border-amber-400/50 bg-amber-400/5" : "border-white/10"
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-xs text-blue-950 font-black">
              {me?.player_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Você</p>
              <p className="font-bold text-sm truncate max-w-[80px]">{me?.player_name}</p>
            </div>
          </div>
          <span className="text-2xl font-black text-amber-400">{me?.score || 0}</span>
        </div>
        
        <div className={`bg-white/5 border rounded-2xl p-4 flex items-center justify-between transition-all ${
          opponentAnswered ? "border-blue-400/50 bg-blue-400/5" : "border-white/10"
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs text-white font-black">
              {opponent?.player_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Oponente</p>
              <p className="font-bold text-sm truncate max-w-[80px]">{opponent?.player_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AnimatePresence>
              {opponentAnswered && (
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }} 
                  className="bg-blue-500 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter"
                >
                  OK
                </motion.div>
              )}
            </AnimatePresence>
            <span className="text-2xl font-black text-white/60">{opponent?.score || 0}</span>
          </div>
        </div>
      </div>

      {/* Action Feedback */}
      <div className="h-6 mb-4">
        <AnimatePresence>
          {firstResponder && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                firstResponder === userId ? "text-amber-400" : "text-blue-400"
              }`}
            >
              ⚡ {firstResponder === userId ? "Você" : opponent?.player_name} respondeu primeiro
            </motion.p>
          )}
          {!firstResponder && opponentAnswered && !selectedOption && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] animate-pulse"
            >
              ⚡ {opponent?.player_name} já respondeu!
            </motion.p>
          )}
          {!firstResponder && selectedOption && !opponentAnswered && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em]"
            >
              ⏳ Aguardando {opponent?.player_name}...
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="w-full max-w-md bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative"
        >
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
             <MascotBadge size="sm" />
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs font-black text-amber-400/60 uppercase tracking-[0.3em] mb-4">
              Pergunta {currentIndex + 1} de {questions.length}
            </p>
            <h2 className="text-xl md:text-2xl font-bold leading-tight text-white/95">
              {currentQuestion.question_text}
            </h2>
          </div>

          <div className="mt-8 space-y-3">
            {[
              { id: "A", text: currentQuestion.option_a },
              { id: "B", text: currentQuestion.option_b },
              { id: "C", text: currentQuestion.option_c },
              { id: "D", text: currentQuestion.option_d },
            ].map((option) => {
              const isSelected = selectedOption === option.id;
              const isCorrectOption = option.id === currentQuestion.correct_option;
              
              let bgColor = "bg-white/5";
              let borderColor = "border-white/10";
              let textColor = "text-white/80";

              if (selectedOption || isTimeOut) {
                if (isCorrectOption) {
                  bgColor = "bg-green-500/20";
                  borderColor = "border-green-500/50";
                  textColor = "text-green-400";
                } else if (isSelected) {
                  bgColor = "bg-red-500/20";
                  borderColor = "border-red-500/50";
                  textColor = "text-red-400";
                } else {
                  bgColor = "bg-white/5 opacity-30";
                }
              }

              return (
                <motion.button
                  key={option.id}
                  whileHover={!(selectedOption || isTimeOut) ? { scale: 1.02, backgroundColor: "rgba(255,255,255,0.1)" } : {}}
                  whileTap={!(selectedOption || isTimeOut) ? { scale: 0.98 } : {}}
                  onClick={() => handleOptionClick(option.id)}
                  className={`w-full p-4 rounded-2xl border ${borderColor} ${bgColor} ${textColor} transition-all flex items-center gap-4 text-left group`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border ${
                    isSelected ? "bg-white text-blue-950 border-white" : "bg-white/5 border-white/10 group-hover:border-white/30"
                  }`}>
                    {option.id}
                  </div>
                  <span className="font-bold flex-1">{option.text}</span>
                  
                  {selectedOption && isCorrectOption && (
                    <span className="text-xl">✨</span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {isTimeOut && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-2xl text-center"
            >
              <p className="text-red-200 font-black uppercase tracking-widest text-xs">
                ⏰ Tempo Esgotado!
              </p>
            </motion.div>
          )}

          {isCorrect !== null && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-6 p-4 rounded-2xl text-center border ${
                isCorrect ? "bg-green-500/20 border-green-500/50" : "bg-red-500/20 border-red-500/50"
              }`}
            >
              <p className={`font-black uppercase tracking-widest text-xs ${
                isCorrect ? "text-green-200" : "text-red-200"
              }`}>
                {isCorrect ? "✨ Resposta Correta!" : "❌ Resposta Errada!"}
              </p>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
