import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { REFILL_POLICY } from "../lib/refillPolicy";

interface Question {
  id: string;
  book: string;
  stage: string;
  level: string;
  question: string;
  options: string[];
  correct_answer: string;
  status: string;
  created_at: string;
}

export default function AdminQuestionsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [refilling, setRefilling] = useState(false);
  const [pendingQuestions, setPendingQuestions] = useState<Question[]>([]);
  
  // Form State
  const [book, setBook] = useState("Gênesis");
  const [stage, setStage] = useState("Criação");
  const [level, setLevel] = useState("basic");
  const [count, setCount] = useState(5);

  // Admin Token (in real app, use auth context or similar)
  // For this demo, we might need to prompt or assume env var on server handles it if we don't send it?
  // The server expects x-admin-token. Let's assume user has to provide it or we hardcode for dev.
  // We'll add a simple input for it.
  const [adminToken, setAdminToken] = useState("");

  useEffect(() => {
    fetchPendingQuestions();
  }, []);

  const fetchPendingQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/questions/pending");
      if (!res.ok) throw new Error("Failed to fetch questions");
      const data = await res.json();
      setPendingQuestions(data);
    } catch (error) {
      console.error(error);
      alert("Erro ao buscar perguntas pendentes");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-token": adminToken
        },
        body: JSON.stringify({ book, stage, level, count }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      
      alert(`Sucesso! ${data.inserted} perguntas geradas.`);
      fetchPendingQuestions();
    } catch (error: any) {
      console.error(error);
      alert(`Erro: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleRefill = async () => {
    setRefilling(true);
    try {
      const res = await fetch("/api/refill", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-token": adminToken
        },
        body: JSON.stringify({ book, stage, level }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to refill");
      
      if (data.action === "no_refill") {
        alert(`Refill não necessário. Atual: ${data.current}, Mínimo: ${data.threshold}`);
      } else if (data.action === "cooldown") {
        alert(`Refill em cooldown. Tente novamente mais tarde.`);
      } else {
        alert(`Refill executado! ${data.inserted} perguntas inseridas.`);
        fetchPendingQuestions();
      }
    } catch (error: any) {
      console.error(error);
      alert(`Erro: ${error.message}`);
    } finally {
      setRefilling(false);
    }
  };

  const handleAction = async (id: string, action: "approve" | "block") => {
    try {
      const res = await fetch(`/api/questions/${id}/${action}`, {
        method: "PATCH",
        headers: {
          "x-admin-token": adminToken
        }
      });
      if (!res.ok) throw new Error("Action failed");
      
      // Remove from list
      setPendingQuestions((prev) => prev.filter((q) => q.id !== id));
    } catch (error) {
      console.error(error);
      alert("Erro ao atualizar pergunta");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Admin: Gerador de Perguntas</h1>
          <div className="flex gap-4 items-center">
             <input 
              type="password" 
              placeholder="Admin Token" 
              value={adminToken}
              onChange={e => setAdminToken(e.target.value)}
              className="p-2 border rounded"
            />
            <button onClick={() => navigate("/home")} className="text-blue-600 hover:underline">
              Voltar ao App
            </button>
          </div>
        </div>

        {/* Generator Form */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Gerar Novas Perguntas (Gemini AI)</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Livro</label>
              <input
                type="text"
                value={book}
                onChange={(e) => setBook(e.target.value)}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Etapa</label>
              <input
                type="text"
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nível</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="basic">Básico</option>
                <option value="intermediate">Intermediário</option>
                <option value="advanced">Avançado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qtd (Manual)</label>
              <input
                type="number"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                min={1}
                max={20}
                className="w-full p-2 border rounded-lg"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
             <button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {generating ? "Gerando..." : "Gerar Manualmente"}
            </button>
            
            <button
              onClick={handleRefill}
              disabled={refilling}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {refilling ? "Verificando..." : "Rodar Auto-Refill"}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Auto-Refill gera até {REFILL_POLICY.MAX_PER_RUN} perguntas se o estoque aprovado for menor que {REFILL_POLICY.MIN_APPROVED}.
          </p>
        </div>

        {/* Pending Questions List */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">Perguntas Pendentes ({pendingQuestions.length})</h2>
            <button 
              onClick={fetchPendingQuestions}
              className="text-sm text-blue-600 hover:underline"
            >
              Atualizar Lista
            </button>
          </div>

          {loading ? (
            <p className="text-gray-500">Carregando...</p>
          ) : pendingQuestions.length === 0 ? (
            <p className="text-gray-500 italic">Nenhuma pergunta pendente.</p>
          ) : (
            <div className="space-y-4">
              {pendingQuestions.map((q) => (
                <div key={q.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="inline-block bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded mr-2">
                        {q.book} / {q.stage}
                      </span>
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {q.level}
                      </span>
                      <span className="ml-2 text-xs text-gray-400">
                        {new Date(q.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(q.id, "approve")}
                        className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm font-medium hover:bg-green-200"
                      >
                        Aprovar
                      </button>
                      <button
                        onClick={() => handleAction(q.id, "block")}
                        className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm font-medium hover:bg-red-200"
                      >
                        Bloquear
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="font-medium text-lg text-gray-900 mb-2">{q.question}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                    {q.options.map((opt, idx) => (
                      <div 
                        key={idx} 
                        className={`p-2 rounded text-sm ${
                          opt === q.correct_answer 
                            ? "bg-green-50 border border-green-200 text-green-800 font-medium" 
                            : "bg-gray-50 border border-gray-100 text-gray-600"
                        }`}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
