"use client";

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { supabase } from "../services/supabaseClient";
import MascotBadge from "./MascotBadge";
import { streakService } from "../services/streakService";
import { getGameState } from "../lib/storage";

interface Player {
  id: string;
  player_name: string;
  user_id: string;
  score: number;
}

export default function MultiplayerResultPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [streakInfo, setStreakInfo] = useState<any>(null);

  useEffect(() => {
    const id = localStorage.getItem("fc_user_id");
    if (id) {
      setUserId(id);
      streakService.updateStreak(id).then(setStreakInfo);
    }

    const fetchResultData = async () => {
      try {
        const { data: roomData, error: roomError } = await supabase
          .from("quiz_rooms")
          .select("id")
          .eq("code", code)
          .single();

        if (roomError || !roomData) throw new Error("Sala não encontrada");

        const { data: playersData, error: playersError } = await supabase
          .from("room_players")
          .select("*")
          .eq("room_id", roomData.id);

        if (playersError) throw playersError;
        setPlayers(playersData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchResultData();
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1F4B] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const me = players.find((p) => p.user_id === userId);
  const opponent = players.find((p) => p.user_id !== userId);
  
  const isDraw = players.length === 2 && players[0].score === players[1].score;
  const isWinner = me && opponent && me.score > opponent.score;

  const handleShareChallenge = () => {
    if (!me) return;
    const correctAnswers = me.score / 10;
    const text = `⚔️ Acabei de jogar um Duelo Bíblico no app Família Carvalho.\n\nFiz ${correctAnswers} acertos.\n\nQuem tem coragem de me desafiar?\n\nfamilia-carvalho.vercel.app`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <main className="min-h-screen bg-[#0B1F4B] text-white p-6 flex flex-col items-center font-manrope">
      <div className="w-full max-w-md flex flex-col items-center mt-12">
        <MascotBadge size="lg" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-8 text-center"
        >
          <h1 className="text-3xl font-black text-amber-400 uppercase tracking-widest mb-2">
            🏆 Resultado do Duelo Bíblico
          </h1>
          <p className="text-white/60 font-bold italic">
            {isDraw ? "Que partida equilibrada!" : isWinner ? "Parabéns, você venceu o duelo!" : "Não foi dessa vez, continue estudando!"}
          </p>
        </motion.div>

        {streakInfo?.rewards && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mt-6 bg-amber-400/20 border border-amber-400/30 p-4 rounded-2xl text-center"
          >
            <p className="text-amber-400 font-black uppercase tracking-widest text-[10px] mb-1">🎁 Recompensa de Sequência!</p>
            <p className="text-white font-bold text-sm">
              {streakInfo.rewards.lives ? "❤️ +1 Vida" : ""}
              {streakInfo.rewards.coins ? "🪙 +10 Moedas" : ""}
              {streakInfo.rewards.badge ? `🏅 Selo "${streakInfo.rewards.badge}"` : ""}
            </p>
          </motion.div>
        )}

        <div className="mt-8 w-full bg-amber-400/10 border border-amber-400/20 rounded-2xl p-3 flex items-center justify-center gap-3">
          <span className="text-2xl">🔥</span>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400/60">Sua Sequência</p>
            <p className="text-lg font-black text-amber-400">{streakInfo?.streak_days || getGameState().streak} Dias</p>
          </div>
        </div>

        <div className="mt-12 w-full space-y-4">
          {sortedPlayers.map((player, idx) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`p-6 rounded-3xl border flex items-center justify-between transition-all ${
                player.user_id === userId 
                  ? "bg-white/10 border-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.1)]" 
                  : "bg-white/5 border-white/10"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl ${
                  idx === 0 ? "bg-amber-400 text-blue-950" : "bg-white/10 text-white"
                }`}>
                  {idx === 0 ? "🥇" : "🥈"}
                </div>
                <div>
                  <p className="font-bold text-lg flex items-center gap-2">
                    {player.player_name}
                    {player.user_id === userId && (
                      <span className="text-[10px] bg-amber-400/20 text-amber-400 px-2 py-0.5 rounded-full uppercase tracking-widest">Você</span>
                    )}
                  </p>
                  <p className="text-xs text-white/40 uppercase font-black tracking-widest">
                    {player.score / 10} acertos
                  </p>
                </div>
              </div>
              <div className="text-2xl font-black text-white/80">
                {player.score}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 w-full space-y-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/duelo")}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-300 text-blue-950 font-extrabold text-xl shadow-lg transition-all"
          >
            Desafiar outra pessoa
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleShareChallenge}
            className="w-full py-4 rounded-2xl bg-green-600 text-white font-bold text-lg shadow-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2"
          >
            <span>💬</span> Compartilhar desafio
          </motion.button>
          
          <button
            onClick={() => navigate("/home")}
            className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-lg hover:bg-white/10 transition-all"
          >
            Voltar para início
          </button>
        </div>
      </div>
    </main>
  );
}
