"use client";

import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { getGameState } from "../lib/storage";
import MascotBadge from "./MascotBadge";

export default function HomePage() {
  const navigate = useNavigate();
  const state = getGameState();

  return (
    <main className="min-h-screen bg-[#0B1F4B] text-white p-6 flex flex-col items-center font-manrope overflow-x-hidden">
      {/* Header */}
      <header className="w-full text-center mt-8 mb-10">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-6xl font-extrabold text-amber-400 drop-shadow-lg mb-1 tracking-[-0.02em] leading-[1.1]"
        >
          Família Carvalho
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl font-semibold text-white uppercase tracking-[0.25em]"
        >
          Quiz Bíblico
        </motion.p>
      </header>

      {/* Mascot Medallion */}
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 15 }}
        className="mb-12"
      >
        <MascotBadge size="lg" />
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-sm mb-10">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center">
          <div className="text-xs text-white/50 uppercase font-bold mb-1">Moedas</div>
          <div className="text-amber-400 font-extrabold flex items-center justify-center gap-1">
            <span>🪙</span> {state.coins}
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center">
          <div className="text-xs text-white/50 uppercase font-bold mb-1">Sequência</div>
          <div className="text-orange-400 font-extrabold flex items-center justify-center gap-1">
            <span>🔥</span> {state.streak}
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center">
          <div className="text-xs text-white/50 uppercase font-bold mb-1">Vidas</div>
          <div className="text-red-400 font-extrabold flex items-center justify-center gap-1">
            <span>❤️</span> {state.lives}
          </div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="w-full max-w-xs space-y-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/quiz")}
          className="w-full py-5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-300 text-blue-950 font-extrabold text-xl shadow-[0_10px_20px_rgba(251,191,36,0.3)] hover:shadow-[0_15px_30px_rgba(251,191,36,0.4)] transition-all"
        >
          Começar a Jogar
        </motion.button>

        <div className="grid grid-cols-2 gap-3">
          <motion.button 
            whileHover={{ backgroundColor: "rgba(255,255,255,0.1)" }}
            onClick={() => navigate("/ranking")}
            className="py-4 rounded-2xl bg-white/5 border border-white/10 transition-all font-bold text-sm backdrop-blur-sm flex flex-col items-center gap-1"
          >
            <span className="text-xl">🏆</span>
            Ranking
          </motion.button>
          <motion.button 
            whileHover={{ backgroundColor: "rgba(255,255,255,0.1)" }}
            onClick={() => navigate("/como-jogar")}
            className="py-4 rounded-2xl bg-white/5 border border-white/10 transition-all font-bold text-sm backdrop-blur-sm flex flex-col items-center gap-1"
          >
            <span className="text-xl">❓</span>
            Como Jogar
          </motion.button>
        </div>

        {/* Daily Challenge Placeholder */}
        <motion.button 
          whileHover={{ backgroundColor: "rgba(255,255,255,0.1)" }}
          onClick={() => navigate("/versiculo-do-dia")}
          className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 transition-all font-bold text-sm backdrop-blur-sm flex items-center justify-center gap-3"
        >
          <span className="text-xl">📅</span>
          Desafio do Dia
        </motion.button>
      </div>
      
      <footer className="mt-auto py-8 text-xs text-white/30 font-medium tracking-widest uppercase italic">
        Para a glória de Deus
      </footer>
    </main>
  );
}
