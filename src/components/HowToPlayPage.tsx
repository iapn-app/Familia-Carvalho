"use client";

import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import MascotBadge from "./MascotBadge";

export default function HowToPlayPage() {
  const navigate = useNavigate();

  const blocks = [
    {
      icon: "❓",
      title: "Responda as Perguntas",
      description: "Você receberá perguntas sobre a Bíblia. Escolha a alternativa que acredita estar correta."
    },
    {
      icon: "⏱",
      title: "Tempo para responder",
      description: "Cada pergunta tem um tempo limite. Se o tempo acabar, a pergunta será considerada errada."
    },
    {
      icon: "❤️",
      title: "Vidas",
      description: "Você começa com 3 vidas. Cada erro faz perder uma vida. Quando as vidas acabam, o jogo termina."
    },
    {
      icon: "🔥",
      title: "Sequência",
      description: "Quanto mais respostas corretas seguidas você tiver, maior será sua sequência de acertos."
    },
    {
      icon: "🪙",
      title: "Moedas",
      description: "Ao acertar perguntas você ganha moedas. Elas servem como recompensa pelo seu conhecimento."
    },
    {
      icon: "🏆",
      title: "Ranking",
      description: "Veja quem está acertando mais perguntas na família. Quem será o maior conhecedor da Bíblia?"
    },
    {
      icon: "⚔️",
      title: "Duelo Bíblico",
      description: "Você pode desafiar alguém da família para um duelo. Os dois recebem as mesmas perguntas. Quem acertar mais vence."
    },
    {
      icon: "📖",
      title: "Mensagem de Deus para você",
      description: "Todos os dias o app mostra um versículo diferente para reflexão e inspiração."
    }
  ];

  return (
    <main className="min-h-screen bg-[#0B1F4B] text-white p-6 flex flex-col items-center font-manrope">
      <div className="w-full max-w-md flex flex-col items-center mt-8 mb-12">
        <MascotBadge size="sm" />
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-black text-amber-400 mt-6 uppercase tracking-widest text-center"
        >
          📖 Como Jogar
        </motion.h1>
        
        <div className="mt-10 w-full space-y-4">
          {blocks.map((block, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white/5 border border-white/10 p-5 rounded-3xl flex items-start gap-5 backdrop-blur-sm"
            >
              <div className="text-4xl bg-white/5 w-16 h-16 rounded-2xl flex items-center justify-center border border-white/5 shrink-0">
                {block.icon}
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-black text-white leading-tight">
                  {block.title}
                </h2>
                <p className="text-sm text-white/60 leading-relaxed">
                  {block.description}
                </p>
              </div>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-amber-400/10 border border-amber-400/20 p-6 rounded-[2.5rem] text-center mt-8"
          >
            <div className="text-4xl mb-3">🙏</div>
            <h2 className="text-amber-400 font-black uppercase tracking-widest text-sm mb-2">
              Para a Glória de Deus
            </h2>
            <p className="text-sm text-white/80 leading-relaxed italic">
              Este aplicativo foi criado para que a família possa aprender mais da Palavra de Deus de forma divertida.
            </p>
          </motion.div>
        </div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          onClick={() => navigate("/home")}
          className="w-full mt-12 py-5 rounded-2xl bg-white/10 border border-white/20 text-white font-black text-lg hover:bg-white/20 transition-all shadow-lg"
        >
          Voltar
        </motion.button>
      </div>
    </main>
  );
}
