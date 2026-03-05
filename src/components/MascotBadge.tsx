import { motion } from "motion/react";

interface MascotBadgeProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function MascotBadge({ size = "md", className = "" }: MascotBadgeProps) {
  const sizeClasses = {
    sm: "w-12 h-12 text-2xl",
    md: "w-24 h-24 text-4xl",
    lg: "w-48 h-48 text-7xl",
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-2xl animate-pulse" />
      <motion.div 
        whileHover={{ scale: 1.05 }}
        className="relative w-full h-full bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 shadow-xl"
      >
        <span className="filter drop-shadow-lg">🦁</span>
        <div className="absolute inset-1 border border-dashed border-amber-400/20 rounded-full animate-[spin_30s_linear_infinite]" />
      </motion.div>
    </div>
  );
}
