"use client";

import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";

/**
 * Starfield Component
 * Creates a subtle parallax effect with twinkling stars
 */
const Starfield = () => {
  const stars = useMemo(() => 
    Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 2,
      driftDuration: Math.random() * 40 + 40,
    })), []);

  return (
    <div className="stars-container">
      {stars.map((star) => (
        <div
          key={star.id}
          className="star"
          style={{
            left: star.left,
            top: star.top,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animation: `
              star-twinkle ${star.duration}s ease-in-out infinite ${star.delay}s,
              parallax-drift ${star.driftDuration}s linear infinite
            `,
          }}
        />
      ))}
    </div>
  );
};

/**
 * GoldParticles Component
 * Floating golden particles with soft blur
 */
const GoldParticles = () => {
  const particles = useMemo(() => 
    Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 4 + 2,
      delay: Math.random() * 8,
      duration: Math.random() * 6 + 6,
    })), []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle-gold"
          style={{
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size}px`,
            // @ts-ignore - custom property for animation
            "--duration": `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

/**
 * LionBadge Component
 * Premium mascot placeholder with scale and fade animations
 */
const LionBadge = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ 
        duration: 1.2, 
        delay: 0.2,
        ease: [0.22, 1, 0.36, 1] 
      }}
      className="relative w-32 h-32 md:w-40 md:h-40 mb-8"
    >
      {/* Outer Glow */}
      <div className="absolute inset-0 lion-badge-glow rounded-full animate-pulse" />
      
      {/* Glass Container */}
      <div className="relative w-full h-full bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 shadow-2xl overflow-hidden">
        {/* Inner Decorative Ring */}
        <div className="absolute inset-2 border border-dashed border-amber-400/20 rounded-full animate-[spin_40s_linear_infinite]" />
        
        {/* Mascot Emoji (Placeholder for real PNG/SVG) */}
        <span className="text-6xl md:text-7xl filter drop-shadow-[0_0_15px_rgba(255,215,0,0.5)] select-none">
          🦁
        </span>
      </div>
    </motion.div>
  );
};

export default function Splash() {
  const navigate = useNavigate();
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Navigate to home after 5 seconds
    const exitTimer = setTimeout(() => setIsExiting(true), 4600);
    const navTimer = setTimeout(() => navigate("/home"), 5000);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(navTimer);
    };
  }, [navigate]);

  return (
    <motion.main 
      initial={{ opacity: 1 }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={{ duration: 0.4 }}
      className="relative min-h-screen overflow-hidden cinematic-bg font-manrope flex flex-col items-center justify-center p-6"
    >
      {/* Animated Background Elements */}
      <Starfield />
      <GoldParticles />

      {/* Central Content */}
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Mascot */}
        <LionBadge />

        {/* Title Block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-2"
        >
          <h1 className="text-5xl md:text-7xl font-extrabold text-[#FFD700] tracking-[-0.02em] leading-tight text-glow-gold">
            Família Carvalho
          </h1>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1, ease: "easeOut" }}
            className="text-2xl md:text-3xl font-semibold text-white uppercase tracking-[0.25em]"
          >
            Quiz Bíblico
          </motion.p>
        </motion.div>

        {/* Slogan */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.85 }}
          transition={{ duration: 1, delay: 1.8 }}
          className="mt-16"
        >
          <p className="text-sm md:text-base font-medium text-white/80 tracking-widest uppercase">
            Para a glória de Deus
          </p>
        </motion.div>
      </div>
    </motion.main>
  );
}
