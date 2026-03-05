"use client";

import { useNavigate } from "react-router-dom";
import React, { useState } from "react";

export default function CreateProfilePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    pin: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      // TODO: Integrate with Supabase here
      // await supabase.from('users').insert(...)
      
      setIsSubmitting(false);
      navigate("/ranking");
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-blue-950 text-white p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl">
        <h1 className="text-2xl font-serif font-bold text-center mb-2 text-amber-400">
          Criar Perfil
        </h1>
        <p className="text-center text-white/60 text-sm mb-8">
          Salve seu progresso e apareça no ranking da família.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">
              Nome Completo
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
              placeholder="Ex: Maria Silva"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">
              Celular (últimos 4 dígitos)
            </label>
            <input
              type="tel"
              required
              maxLength={4}
              pattern="[0-9]{4}"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
              placeholder="Ex: 9988"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">
              PIN Secreto (4 dígitos)
            </label>
            <input
              type="password"
              required
              maxLength={4}
              pattern="[0-9]{4}"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
              placeholder="••••"
              value={formData.pin}
              onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 mt-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-300 text-blue-950 font-bold text-lg shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Criando..." : "Criar Perfil"}
          </button>
        </form>

        <button
          onClick={() => navigate("/home")}
          className="w-full mt-4 text-sm text-white/40 hover:text-white transition-colors"
        >
          Cancelar e voltar
        </button>
      </div>
    </main>
  );
}
