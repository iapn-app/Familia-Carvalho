"use client";

import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getGameState } from "../lib/storage";
import MascotBadge from "./MascotBadge";
import { supabase } from "../services/supabaseClient";

interface DailyVerse {
  id: number;
  verse: string;
  reference: string;
}

export default function HomePage() {
  const navigate = useNavigate();
  const state = getGameState();
  const [dailyVerse, setDailyVerse] = useState<DailyVerse | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingVerse, setLoadingVerse] = useState(true);

  useEffect(() => {
    const fetchDailyVerse = async () => {
      try {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        // Specific calculation requested by user
        const start = new Date(today.getFullYear(), 0, 0);
        const diff = (today as any) - (start as any);
        const dayOfYear = Math.floor(diff / 86400000);

        // Check cache using requested key: daily_verse_seen
        const cached = localStorage.getItem('daily_verse_seen');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.date === todayStr) {
            setDailyVerse(parsed.verse);
            setLoadingVerse(false);
            return;
          }
        }

        const { data, error } = await supabase
          .from("daily_verses")
          .select("*");

        if (error) throw error;

        if (data && data.length > 0) {
          // Specific index calculation requested by user
          const verseIndex = dayOfYear % data.length;
          const verseOfDay = data[verseIndex];
          
          setDailyVerse(verseOfDay);
          localStorage.setItem('daily_verse_seen', JSON.stringify({
            date: todayStr,
            verse: verseOfDay
          }));
        }
      } catch (err) {
        console.error("Error fetching daily verse:", err);
      } finally {
        setLoadingVerse(false);
      }
    };

    fetchDailyVerse();
  }, []);

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

        {/* Daily Verse Card */}
        <motion.button 
          whileHover={{ backgroundColor: "rgba(255,255,255,0.1)" }}
          onClick={() => dailyVerse && setShowModal(true)}
          className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 transition-all text-left backdrop-blur-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
            <span className="text-2xl">📖</span>
          </div>
          
          <h3 className="text-amber-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
            📖 Mensagem de Deus para você hoje
          </h3>
          
          {loadingVerse ? (
            <div className="h-10 flex items-center">
              <div className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin"></div>
            </div>
          ) : dailyVerse ? (
            <div className="space-y-1">
              <p className="text-sm font-bold line-clamp-2 leading-relaxed text-white/90 italic">
                "{dailyVerse.verse}"
              </p>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-wider">
                — {dailyVerse.reference}
              </p>
            </div>
          ) : (
            <p className="text-xs text-white/40 italic">
              "Lâmpada para os meus pés é tua palavra e luz, para o meu caminho."
            </p>
          )}
        </motion.button>
      </div>

      {/* Verse Modal */}
      <AnimatePresence>
        {showModal && dailyVerse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-blue-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white/10 border border-white/20 p-8 rounded-[2.5rem] max-w-sm w-full shadow-2xl backdrop-blur-2xl"
            >
              <div className="text-center mb-6">
                <span className="text-4xl mb-4 block">🕊️</span>
                <h2 className="text-amber-400 text-xs font-black uppercase tracking-[0.3em]">
                  Palavra do Dia
                </h2>
              </div>
              
              <p className="text-xl md:text-2xl font-bold text-center leading-relaxed mb-6 italic text-white/95">
                "{dailyVerse.verse}"
              </p>
              
              <div className="flex flex-col items-center gap-6">
                <span className="px-4 py-1.5 bg-amber-400 text-blue-950 rounded-full font-black text-xs uppercase tracking-widest">
                  {dailyVerse.reference}
                </span>
                
                <button 
                  onClick={() => setShowModal(false)}
                  className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-black text-sm transition-all border border-white/10"
                >
                  Amém
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <footer className="mt-auto py-8 text-xs text-white/30 font-medium tracking-widest uppercase italic">
        Para a glória de Deus
      </footer>
    </main>
  );
}
