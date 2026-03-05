"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { supabase } from "../services/supabaseClient";
import { v4 as uuidv4 } from "uuid";

export default function MultiplayerPage() {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    let id = localStorage.getItem("fc_user_id");
    let name = localStorage.getItem("fc_user_name") || "";
    if (!id) {
      id = uuidv4();
      localStorage.setItem("fc_user_id", id);
    }
    setUserId(id);
    setUserName(name);
  }, []);

  const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleCreateRoom = async () => {
    if (!userName.trim()) {
      setError("Por favor, digite seu nome primeiro.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const code = generateCode();
      localStorage.setItem("fc_user_name", userName);

      // 1. Create the room
      const { data: room, error: roomError } = await supabase
        .from("quiz_rooms")
        .insert([{ code, status: "waiting" }])
        .select()
        .single();

      if (roomError) throw roomError;

      // 2. Add current player
      const { error: playerError } = await supabase
        .from("room_players")
        .insert([{ 
          room_id: room.id, 
          user_id: userId, 
          player_name: userName,
          is_host: true
        }]);

      if (playerError) throw playerError;

      navigate(`/lobby/${code}`);
    } catch (err: any) {
      console.error(err);
      setError("Erro ao criar duelo. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!userName.trim()) {
      setError("Por favor, digite seu nome primeiro.");
      return;
    }
    if (roomCode.length !== 6) {
      setError("O código deve ter 6 números.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      localStorage.setItem("fc_user_name", userName);

      // 1. Find the room
      const { data: room, error: roomError } = await supabase
        .from("quiz_rooms")
        .select("*")
        .eq("code", roomCode)
        .single();

      if (roomError || !room) throw new Error("Duelo não encontrado.");
      if (room.status !== "waiting") throw new Error("Este duelo já iniciou ou foi finalizado.");

      // 2. Check players count
      const { data: players, error: playersError } = await supabase
        .from("room_players")
        .select("id")
        .eq("room_id", room.id);

      if (playersError) throw playersError;
      if (players && players.length >= 2) throw new Error("Duelo já tem 2 jogadores.");

      // 3. Join the room
      const { error: joinError } = await supabase
        .from("room_players")
        .insert([{ 
          room_id: room.id, 
          user_id: userId, 
          player_name: userName,
          is_host: false
        }]);

      if (joinError) throw joinError;

      navigate(`/lobby/${roomCode}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao entrar no duelo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0B1F4B] text-white p-6 flex flex-col items-center font-manrope">
      <header className="w-full max-w-md flex items-center justify-between mb-12 mt-4">
        <button onClick={() => navigate("/home")} className="p-2 bg-white/5 rounded-xl border border-white/10">
          <span className="text-xl">⬅️</span>
        </button>
        <h1 className="text-2xl font-black text-amber-400 uppercase tracking-widest">Duelo Bíblico</h1>
        <div className="w-10" />
      </header>

      <div className="w-full max-w-sm space-y-8">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
            <span>👤</span> Seu Perfil
          </h2>
          <div>
            <label className="text-xs text-white/50 uppercase font-bold mb-1 block">Como quer ser chamado?</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Digite seu nome"
              className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-amber-400 transition-all"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>⚔️</span> Criar Duelo
            </h2>
            <p className="text-sm text-white/60">Crie um duelo e convide alguém para testar conhecimentos.</p>
            <button
              onClick={handleCreateRoom}
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-amber-400 text-blue-950 font-extrabold text-lg shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {loading ? "Criando..." : "Criar Novo Duelo"}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0B1F4B] px-2 text-white/30 font-bold tracking-widest">OU</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🔑</span> Entrar em Duelo
            </h2>
            <div>
              <input
                type="text"
                inputMode="numeric"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                maxLength={6}
                className="w-full py-4 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-center font-black text-2xl tracking-[0.5em] outline-none focus:border-amber-400 transition-all placeholder:text-white/10"
              />
            </div>
            <button
              onClick={handleJoinRoom}
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-white/10 border border-white/20 text-white font-extrabold text-lg shadow-lg hover:bg-white/20 transition-all disabled:opacity-50"
            >
              {loading ? "Entrando..." : "Entrar no Duelo"}
            </button>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-500/20 border border-red-500/50 rounded-2xl text-red-200 text-sm text-center font-bold"
          >
            {error}
          </motion.div>
        )}
      </div>
    </main>
  );
}
