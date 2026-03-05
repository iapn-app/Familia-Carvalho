"use client";

import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function RankingPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Básico");

  const MOCK_RANKING = [
    { name: "Maria", score: 1250, level: "Básico" },
    { name: "João", score: 1100, level: "Básico" },
    { name: "Pedro", score: 950, level: "Básico" },
    { name: "Ana", score: 800, level: "Básico" },
    { name: "Lucas", score: 750, level: "Básico" },
  ];

  return (
    <main className="min-h-screen bg-blue-950 text-white p-6 flex flex-col">
      <header className="flex justify-between items-center mb-6">
        <button onClick={() => navigate("/home")} className="text-white/60 hover:text-white">
          ← Voltar
        </button>
        <h1 className="text-xl font-bold text-amber-400">Ranking</h1>
        <div className="w-8" /> {/* Spacer */}
      </header>

      {/* Tabs */}
      <div className="flex justify-center gap-2 mb-6 bg-white/5 p-1 rounded-xl">
        {["Básico", "Intermediário", "Avançado"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? "bg-amber-400 text-blue-950 shadow-md"
                : "text-white/60 hover:bg-white/10"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 space-y-3">
        {MOCK_RANKING.map((player, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-4">
              <span className={`text-lg font-bold w-6 text-center ${
                index === 0 ? "text-yellow-400" :
                index === 1 ? "text-gray-300" :
                index === 2 ? "text-amber-600" : "text-white/40"
              }`}>
                {index + 1}
              </span>
              <div className="font-medium">{player.name}</div>
            </div>
            <div className="text-amber-400 font-bold">{player.score} pts</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-900 to-blue-800 rounded-2xl border border-white/10 text-center">
        <p className="text-sm text-white/80 mb-3">
          Quer aparecer no ranking da família?
        </p>
        <button
          onClick={() => navigate("/perfil/criar")}
          className="w-full py-3 rounded-xl bg-white text-blue-900 font-bold hover:bg-gray-100 transition-colors shadow-lg"
        >
          Criar Perfil Agora
        </button>
      </div>
    </main>
  );
}
