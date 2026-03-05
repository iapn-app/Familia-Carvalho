import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { supabaseAdmin } from "./src/services/supabaseAdmin";
import { validateQuestionsArray } from "./src/lib/validateQuestions";
import { REFILL_POLICY } from "./src/lib/refillPolicy";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini
const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GOOGLE_GEMINI_API_KEY is missing!");
}
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

// Middleware for Admin Token
const requireAdminToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.headers["x-admin-token"];
  const envToken = process.env.ADMIN_TOKEN;
  
  // If no ADMIN_TOKEN is set in env, we skip check (dev mode) or block all?
  // Let's assume if env var is set, we check it. If not, we allow (or block).
  // For security, if ADMIN_TOKEN is set, we must match it.
  if (envToken && token !== envToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

// Helper: Log Generation
async function logGeneration(data: any) {
  try {
    const { error } = await supabaseAdmin.from("ai_generation_logs").insert(data);
    if (error) {
      if (error.code === "PGRST116" || error.message?.includes("table 'public.ai_generation_logs'")) {
        // Silent if table missing, we already warned in checkCooldown
        return;
      }
      console.error("Failed to log generation:", error.message || JSON.stringify(error));
    }
  } catch (e) {
    console.error("Unexpected error logging generation:", e);
  }
}

// Helper: Check Cooldown
async function checkCooldown(book: string, stage: string, level: string): Promise<boolean> {
  const minutes = REFILL_POLICY.COOLDOWN_MINUTES;
  const timeAgo = new Date(Date.now() - minutes * 60 * 1000).toISOString();
  
  const { data, error } = await supabaseAdmin
    .from("ai_generation_logs")
    .select("id")
    .eq("book", book)
    .eq("stage", stage)
    .eq("level", level)
    .eq("status", "success")
    .gte("created_at", timeAgo)
    .limit(1);
    
  if (error) {
    // If table doesn't exist, we just log it once and return false (no cooldown)
    if (error.code === "PGRST116" || error.message?.includes("table 'public.ai_generation_logs'")) {
      console.warn("Table 'ai_generation_logs' not found. Cooldown check skipped. Please create the table in Supabase.");
      return false;
    }
    console.error("Error checking cooldown:", error.message || JSON.stringify(error));
    return false; // Fail safe: allow generation if check fails? Or block? Let's allow.
  }
  
  return data && data.length > 0; // True if cooldown is active (found recent log)
}

// Helper: Generate Questions Logic
async function generateQuestionsLogic(book: string, stage: string, level: string, count: number, approve: boolean) {
  const prompt = `
    Gere ${count} perguntas de quiz bíblico sobre o livro de ${book}, etapa "${stage}", nível "${level}".
    Retorne APENAS um JSON válido contendo um array de objetos.
    NÃO inclua markdown code blocks (ex: \`\`\`json). Retorne apenas o JSON puro.
    
    Formato de cada objeto:
    {
      "book": "${book}",
      "stage": "${stage}",
      "level": "${level}",
      "difficulty": 2, // Inteiro entre 1 e 10
      "question": "Texto da pergunta em pt-BR",
      "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
      "correct_answer": "Uma das opções exata",
      "explanation": "Explicação breve"
    }

    Regras:
    - options sempre com 4 itens
    - correct_answer deve ser exatamente igual a uma das opções
    - texto em pt-BR
    - sem citar versículos longos; evitar copiar texto bíblico; perguntas baseadas em fatos/histórias
    - difficulty deve variar se possível, mas manter média compatível com nível ${level}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    }
  });

  const text = response.text;
  if (!text) throw new Error("Empty response from Gemini");

  let questions;
  try {
    questions = JSON.parse(text);
  } catch (e) {
    throw new Error(`Failed to parse JSON: ${text}`);
  }

  const validation = validateQuestionsArray(questions);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const status = approve ? "approved" : "pending";
  const questionsToInsert = questions.map((q: any) => ({
    ...q,
    status,
    source: "gemini-auto",
    created_at: new Date().toISOString(),
  }));

  const { data, error } = await supabaseAdmin
    .from("questions")
    .insert(questionsToInsert)
    .select();

  if (error) throw error;

  return data;
}

// API Routes

// Auto-Refill Route
app.post("/api/refill", requireAdminToken, async (req, res) => {
  const { book, stage, level, autoApprove = false } = req.body;
  
  if (!book || !stage || !level) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // 1. Check current approved count
    const { count, error } = await supabaseAdmin
      .from("questions")
      .select("*", { count: "exact", head: true })
      .eq("book", book)
      .eq("stage", stage)
      .eq("level", level)
      .eq("status", "approved");

    if (error) throw error;

    const currentCount = count || 0;
    
    if (currentCount >= REFILL_POLICY.MIN_APPROVED) {
      return res.json({ ok: true, action: "no_refill", current: currentCount, threshold: REFILL_POLICY.MIN_APPROVED });
    }

    // 2. Calculate needed
    let needed = (REFILL_POLICY.MIN_APPROVED - currentCount) + REFILL_POLICY.BUFFER;
    if (needed > REFILL_POLICY.MAX_PER_RUN) needed = REFILL_POLICY.MAX_PER_RUN;

    // 3. Check cooldown
    const onCooldown = await checkCooldown(book, stage, level);
    if (onCooldown) {
      return res.json({ ok: true, action: "cooldown", message: "Refill ran recently for this combination" });
    }

    // 4. Generate
    const insertedData = await generateQuestionsLogic(book, stage, level, needed, autoApprove);
    
    // 5. Log success
    await logGeneration({
      book, stage, level,
      requested_count: needed,
      inserted_count: insertedData?.length || 0,
      status: "success"
    });

    res.json({ ok: true, action: "refilled", inserted: insertedData?.length, current: currentCount });

  } catch (error: any) {
    console.error("Refill error:", error.message || JSON.stringify(error));
    await logGeneration({
      book, stage, level,
      requested_count: 0,
      inserted_count: 0,
      status: "failed",
      error: error.message
    });
    res.status(500).json({ error: error.message });
  }
});

// Manual Generate Route
app.post("/api/generate-questions", requireAdminToken, async (req, res) => {
  const { book, stage, level, count = 5, approve = false } = req.body;
  try {
    if (!book || !stage || !level) {
      return res.status(400).json({ error: "Missing required fields: book, stage, level" });
    }

    const insertedData = await generateQuestionsLogic(book, stage, level, count, approve);
    
    await logGeneration({
      book, stage, level,
      requested_count: count,
      inserted_count: insertedData?.length || 0,
      status: "success"
    });

    res.json({ success: true, inserted: insertedData?.length, questions: insertedData });

  } catch (error: any) {
    console.error("Error generating questions:", error);
    await logGeneration({
      book: book || "unknown",
      stage: stage || "unknown",
      level: level || "unknown",
      requested_count: count || 0,
      inserted_count: 0,
      status: "failed",
      error: error.message
    });
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

// Get Pending Questions
app.get("/api/questions/pending", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("questions")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Approve Question
app.patch("/api/questions/:id/approve", requireAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from("questions")
      .update({ status: "approved" })
      .eq("id", id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Block Question
app.patch("/api/questions/:id/block", requireAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from("questions")
      .update({ status: "blocked" })
      .eq("id", id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// Vite Middleware (Must be last)
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files from dist
    // app.use(express.static("dist"));
    // app.get("*", (req, res) => res.sendFile("dist/index.html"));
    console.log("Production mode not fully configured in this snippet.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
