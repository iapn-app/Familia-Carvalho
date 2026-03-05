"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";

interface IntroStep {
  title?: string;
  text: string;
  buttonText?: string;
}

const INTRO_STEPS: IntroStep[] = [
  {
    title: "Espere um momento...",
    text: "Já parou para pensar em algo sério?\nUm dia Jesus vai voltar.\nE nesse dia não vai existir Google...\nnão vai existir tempo para pesquisar...\nSó vai existir a verdade do coração.",
  },
  {
    title: "Imagine esse momento...",
    text: "Você chega diante de Jesus e diz:\n'Senhor, eu te conheço!'\nE Ele responde:\n'Será mesmo?'",
  },
  {
    title: "Aí Jesus pergunta...",
    text: "Você lembra do Quiz Família Carvalho?\nAquele quiz da Bíblia...\nVocê errava tudo 😅",
  },
  {
    text: "E você ainda quer dizer que me conhece?\nCara de pau 😄\nBrincadeiras à parte...\nAinda dá tempo de aprender mais da Palavra.",
  },
  {
    title: "Vamos testar seu conhecimento bíblico?",
    text: "Prepare-se.\nAlgumas perguntas são fáceis.\nOutras nem tanto.\nMas o importante é aprender mais sobre Deus.",
    buttonText: "Começar o Quiz",
  },
];

export default function IntroPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // If already seen 5 times, redirect to home
    const count = parseInt(localStorage.getItem("intro_seen_count") || "0");
    if (count >= 5) {
      navigate("/home");
    }
  }, [navigate]);

  const handleNext = () => {
    if (currentStep < INTRO_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    const count = parseInt(localStorage.getItem("intro_seen_count") || "0");
    localStorage.setItem("intro_seen_count", (count + 1).toString());
    navigate("/home");
  };

  const handleSkip = () => {
    handleFinish();
  };

  const step = INTRO_STEPS[currentStep];

  return (
    <main className="min-h-screen bg-[#0B1F4B] text-white flex flex-col items-center justify-center p-6 font-manrope relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[100px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 blur-[100px] rounded-full" />

      {/* Skip Button */}
      {currentStep < INTRO_STEPS.length - 1 && (
        <button
          onClick={handleSkip}
          className="absolute top-8 right-8 text-white/40 hover:text-white/80 transition-colors uppercase tracking-widest text-xs font-black"
        >
          Pular
        </button>
      )}

      <div className="max-w-md w-full text-center z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="flex flex-col items-center"
          >
            {step.title && (
              <h1 className="text-2xl md:text-3xl font-black text-amber-400 mb-6 leading-tight">
                {step.title}
              </h1>
            )}
            
            <p className="text-lg md:text-xl text-white/80 leading-relaxed whitespace-pre-line font-medium mb-12">
              {step.text}
            </p>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
              className={`px-8 py-4 rounded-2xl font-black text-lg transition-all shadow-xl ${
                step.buttonText 
                  ? "bg-amber-400 text-blue-950 hover:bg-amber-300 w-full" 
                  : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
              }`}
            >
              {step.buttonText || "Continuar"}
            </motion.button>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress Dots */}
      <div className="absolute bottom-12 flex gap-2">
        {INTRO_STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === currentStep ? "w-8 bg-amber-400" : "w-2 bg-white/20"
            }`}
          />
        ))}
      </div>
    </main>
  );
}
