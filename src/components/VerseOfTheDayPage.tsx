"use client";

import { useNavigate } from "react-router-dom";

export default function VerseOfTheDayPage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-blue-950 text-white p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl text-center">
        <h1 className="text-2xl font-serif font-bold text-amber-400 mb-6">
          Versículo do Dia
        </h1>

        <blockquote className="text-xl font-serif italic text-white/90 leading-relaxed mb-4">
          "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito,
          para que todo aquele que nele crê não pereça, mas tenha a vida eterna."
        </blockquote>

        <p className="text-sm text-white/60 font-medium uppercase tracking-widest mb-8">
          João 3:16
        </p>

        <button
          onClick={() => navigate("/home")}
          className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-medium border border-white/10"
        >
          Voltar para Home
        </button>
      </div>
    </main>
  );
}
