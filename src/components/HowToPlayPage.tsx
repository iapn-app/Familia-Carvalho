"use client";

import { useNavigate } from "react-router-dom";

export default function HowToPlayPage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-blue-950 text-white p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl">
        <h1 className="text-2xl font-serif font-bold text-center mb-6 text-amber-400">
          Como Jogar
        </h1>

        <div className="space-y-6 text-white/80 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Objetivo</h2>
            <p className="text-sm">
              Responda perguntas bíblicas corretamente para ganhar pontos e moedas.
              Avance pelos livros da Bíblia e suba no ranking da família.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. Vidas ❤️</h2>
            <p className="text-sm">
              Você começa com 3 vidas. Cada erro custa 1 vida. Se perder todas,
              a rodada termina.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. Moedas 🪙</h2>
            <p className="text-sm">
              Ganhe moedas acertando perguntas. Use moedas para comprar vidas extras
              ou pular perguntas difíceis.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">4. Ranking 🏆</h2>
            <p className="text-sm">
              Crie um perfil para salvar sua pontuação e competir com outros membros
              da família.
            </p>
          </section>
        </div>

        <button
          onClick={() => navigate("/home")}
          className="w-full mt-8 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-medium border border-white/10"
        >
          Voltar para Home
        </button>
      </div>
    </main>
  );
}
