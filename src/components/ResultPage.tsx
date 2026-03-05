"use client";

import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { GameState, getGameState, resetGameState, updateGameState } from "../lib/storage";
import { streakService } from "../services/streakService";

export default function ResultPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<GameState>(getGameState());
  const [streakInfo, setStreakInfo] = useState<any>(null);

  useEffect(() => {
    if (!state.isGameOver) {
      navigate("/home");
      return;
    }

    const userId = localStorage.getItem("fc_user_id");
    if (userId) {
      streakService.updateStreak(userId).then((info) => {
        if (info) {
          setStreakInfo(info);
          // Update local state to show rewards if any
          setState(getGameState());
        }
      });
    }
  }, [navigate]);

  const handlePlayAgain = () => {
    resetGameState();
    navigate("/quiz");
  };

  const handleHome = () => {
    resetGameState();
    navigate("/home");
  };

  const handleSaveScore = () => {
    navigate("/perfil/criar");
  };

  const getMascotMessage = () => {
    if (state.lives <= 0) return "Não desanime! Vamos tentar mais uma vez?";
    if (state.correctAnswers >= 4) return "Excelente! Você é um mestre da Bíblia!";
    if (state.correctAnswers >= 2) return "Muito bom! Continue praticando!";
    return "Bom começo! Que tal ler mais um pouco e tentar de novo?";
  };

  return (
    <main className="min-h-screen bg-[#0B1F4B] text-white p-6 flex flex-col items-center justify-center font-manrope">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] text-center relative overflow-hidden"
      >
        {/* Decorative Background Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-400/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="text-7xl mb-4 filter drop-shadow-lg"
          >
            {state.lives > 0 ? "🏆" : "💪"}
          </motion.div>

          <h1 className="text-3xl font-black text-amber-400 mb-2 uppercase tracking-tight">
            Fim da Rodada
          </h1>
          
          <div className="bg-white/5 rounded-2xl p-4 mb-8 border border-white/5">
            <p className="text-white/80 font-bold italic leading-relaxed">
              “{getMascotMessage()}”
            </p>
            <div className="mt-2 text-2xl">🦁</div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white/5 p-4 rounded-3xl border border-white/5 flex flex-col items-center">
              <div className="text-xs text-white/40 uppercase font-black tracking-widest mb-1">Pontos</div>
              <div className="text-3xl font-black text-white">{state.score}</div>
            </div>
            <div className="bg-white/5 p-4 rounded-3xl border border-white/5 flex flex-col items-center">
              <div className="text-xs text-white/40 uppercase font-black tracking-widest mb-1">Acertos</div>
              <div className="text-3xl font-black text-green-400">{state.correctAnswers}</div>
            </div>
            <div className="bg-white/5 p-4 rounded-3xl border border-white/5 flex flex-col items-center">
              <div className="text-xs text-white/40 uppercase font-black tracking-widest mb-1">Erros</div>
              <div className="text-3xl font-black text-red-400">{state.wrongAnswers}</div>
            </div>
            <div className="bg-white/5 p-4 rounded-3xl border border-white/5 flex flex-col items-center">
              <div className="text-xs text-white/40 uppercase font-black tracking-widest mb-1">Seq. Máx</div>
              <div className="text-3xl font-black text-orange-400">{state.maxStreak || 0}</div>
            </div>
            <div className="bg-white/5 p-4 rounded-3xl border border-white/5 flex flex-col items-center">
              <div className="text-xs text-white/40 uppercase font-black tracking-widest mb-1">Moedas</div>
              <div className="text-3xl font-black text-yellow-400">+{state.roundCoins || 0}</div>
            </div>
          </div>

          {streakInfo?.rewards && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-400/20 border border-amber-400/30 p-4 rounded-2xl mb-6 text-center"
            >
              <p className="text-amber-400 font-black uppercase tracking-widest text-[10px] mb-1">🎁 Recompensa de Sequência!</p>
              <p className="text-white font-bold text-sm">
                {streakInfo.rewards.lives ? "❤️ +1 Vida" : ""}
                {streakInfo.rewards.coins ? "🪙 +10 Moedas" : ""}
                {streakInfo.rewards.badge ? `🏅 Selo "${streakInfo.rewards.badge}"` : ""}
              </p>
            </motion.div>
          )}

          <div className="bg-amber-400/10 border border-amber-400/20 rounded-2xl p-3 mb-8 flex items-center justify-center gap-3">
            <span className="text-2xl">🔥</span>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400/60">Sequência Atual</p>
              <p className="text-lg font-black text-amber-400">{streakInfo?.streak_days || state.streak} Dias</p>
            </div>
          </div>

          <div className="space-y-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePlayAgain}
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-300 text-blue-950 font-black text-xl shadow-xl hover:shadow-amber-400/20 transition-all"
            >
              Continuar jogando
            </motion.button>
            
            <button
              onClick={handleSaveScore}
              className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all font-extrabold border border-white/10 text-white/80"
            >
              Salvar no Ranking
            </button>

            <button
              onClick={handleHome}
              className="w-full py-2 text-white/40 hover:text-white/60 transition-colors text-sm font-bold uppercase tracking-widest"
            >
              Voltar para início
            </button>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
