"use client";

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../services/supabaseClient";
import MascotBadge from "./MascotBadge";

interface Player {
  id: string;
  player_name: string;
  user_id: string;
  is_host: boolean;
}

export default function LobbyPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState<any>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("fc_user_id");
    if (id) setUserId(id);

    const fetchRoomData = async () => {
      try {
        const { data: roomData, error: roomError } = await supabase
          .from("quiz_rooms")
          .select("*")
          .eq("code", code)
          .single();

        if (roomError || !roomData) throw new Error("Sala não encontrada");
        setRoom(roomData);

        const { data: playersData, error: playersError } = await supabase
          .from("room_players")
          .select("*")
          .eq("room_id", roomData.id);

        if (playersError) throw playersError;
        setPlayers(playersData || []);

        // Realtime subscription for players
        const playersSubscription = supabase
          .channel(`room_players_${roomData.id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "room_players",
              filter: `room_id=eq.${roomData.id}`,
            },
            (payload) => {
              if (payload.eventType === "INSERT") {
                setPlayers((prev) => [...prev, payload.new as Player]);
              } else if (payload.eventType === "DELETE") {
                setPlayers((prev) => prev.filter((p) => p.id !== payload.old.id));
              }
            }
          )
          .subscribe();

        // Realtime subscription for room status
        const roomSubscription = supabase
          .channel(`quiz_rooms_${roomData.id}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "quiz_rooms",
              filter: `id=eq.${roomData.id}`,
            },
            (payload) => {
              const updatedRoom = payload.new;
              setRoom(updatedRoom);
              if (updatedRoom.status === "playing") {
                navigate(`/duelo-quiz/${code}`);
              }
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(playersSubscription);
          supabase.removeChannel(roomSubscription);
        };
      } catch (err) {
        console.error(err);
        navigate("/duelo");
      } finally {
        setLoading(false);
      }
    };

    fetchRoomData();
  }, [code, navigate]);

  useEffect(() => {
    // Auto-start logic
    if (players.length === 2 && room?.status === "waiting") {
      const currentPlayer = players.find((p) => p.user_id === userId);
      if (currentPlayer?.is_host) {
        startQuiz();
      }
    }
  }, [players, room, userId]);

  const startQuiz = async () => {
    try {
      // 1. Fetch 10 random questions
      const { data: questions, error: qError } = await supabase
        .from("questions")
        .select("id")
        .limit(10);

      if (qError) throw qError;

      const questionIds = questions.map((q) => q.id);

      // 2. Update room status and question IDs
      const { error: updateError } = await supabase
        .from("quiz_rooms")
        .update({ 
          status: "playing",
          question_ids: questionIds
        })
        .eq("id", room.id);

      if (updateError) throw updateError;
    } catch (err) {
      console.error("Error starting quiz:", err);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: "Duelo Bíblico - Família Carvalho",
      text: `Ei! Vamos duelar no Quiz Bíblico? Use o código: ${code}`,
      url: window.location.origin,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(code || "");
        alert("Código copiado para a área de transferência!");
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1F4B] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B1F4B] text-white p-6 flex flex-col items-center font-manrope">
      <div className="w-full max-w-md flex flex-col items-center mt-12">
        <MascotBadge size="md" />
        <h1 className="text-3xl font-black text-amber-400 mt-6 uppercase tracking-widest text-center">
          Duelo Bíblico
        </h1>
        
        <div className="mt-8 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 w-full text-center space-y-6 shadow-2xl">
          <div className="space-y-2">
            <p className="text-xs text-white/50 uppercase font-black tracking-[0.2em]">Código do Duelo</p>
            <div className="text-6xl font-black text-white tracking-[0.3em] bg-white/5 py-6 rounded-2xl border border-white/5">
              {code}
            </div>
          </div>
          
          <button
            onClick={handleShare}
            className="w-full py-4 rounded-2xl bg-white/10 border border-white/20 text-white font-bold text-sm hover:bg-white/20 transition-all flex items-center justify-center gap-2"
          >
            <span>🔗</span> Compartilhar código
          </button>
          
          <p className="text-sm text-white/40 italic">Aguardando oponente para iniciar automaticamente...</p>
        </div>

        <div className="mt-10 w-full space-y-4">
          <h2 className="text-sm font-black text-amber-400/60 uppercase tracking-widest px-2">
            Jogadores ({players.length}/2)
          </h2>
          
          <div className="grid grid-cols-1 gap-3 w-full">
            <AnimatePresence mode="popLayout">
              {players.map((player, idx) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center text-blue-950 font-black">
                      {player.player_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-lg">{player.player_name}</p>
                      <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">
                        {player.is_host ? "Anfitrião" : "Convidado"}
                      </p>
                    </div>
                  </div>
                  {player.user_id === userId && (
                    <span className="text-[10px] bg-white/10 px-2 py-1 rounded-full font-black uppercase tracking-widest text-white/60">
                      Você
                    </span>
                  )}
                </motion.div>
              ))}
              
              {players.length < 2 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  className="bg-white/5 border border-dashed border-white/20 p-4 rounded-2xl flex items-center justify-center gap-3"
                >
                  <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                  <p className="text-sm font-bold italic">Aguardando oponente...</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <button
          onClick={() => navigate("/duelo")}
          className="mt-12 text-sm text-white/40 hover:text-white transition-colors font-bold uppercase tracking-widest"
        >
          Sair da Sala
        </button>
      </div>
    </main>
  );
}
