/**
 * Importa perguntas JSON no Supabase, com validações.
 * Uso:
 * 1) npm i @supabase/supabase-js
 * 2) set SUPABASE_URL e SUPABASE_ANON_KEY no .env (ou export no terminal)
 * 3) node import_questions.js batch1.json
 */

const fs = require("fs");
const path = require("path");
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

// Fallback to NEXT_PUBLIC_ variables if SUPABASE_URL/KEY are not set
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("DEBUG ENV:", {
  SUPABASE_URL: SUPABASE_URL ? "Found" : "Missing",
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Found" : "Missing",
  SUPABASE_ANON_KEY: SUPABASE_ANON_KEY ? "Found" : "Missing",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Found" : "Missing"
});

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ Defina SUPABASE_URL e SUPABASE_ANON_KEY (ou as versões NEXT_PUBLIC_) nas variáveis de ambiente.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const file = process.argv[2];
if (!file) {
  console.error("Uso: node import_questions.js batch1.json");
  process.exit(1);
}

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function normalize(s) {
  return s.trim().replace(/\s+/g, " ");
}

function validateQuestion(q, idx) {
  const required = ["book", "stage", "level", "difficulty", "question", "options", "correct_answer", "explanation"];
  for (const k of required) {
    if (q[k] === undefined || q[k] === null) throw new Error(`Item ${idx}: campo ausente "${k}"`);
  }

  if (!isNonEmptyString(q.book)) throw new Error(`Item ${idx}: book inválido`);
  if (!isNonEmptyString(q.stage)) throw new Error(`Item ${idx}: stage inválido`);
  if (!isNonEmptyString(q.level)) throw new Error(`Item ${idx}: level inválido`);
  if (!Number.isInteger(q.difficulty) || q.difficulty < 1 || q.difficulty > 3) {
    throw new Error(`Item ${idx}: difficulty deve ser 1..3`);
  }
  if (!isNonEmptyString(q.question)) throw new Error(`Item ${idx}: question inválida`);
  if (!Array.isArray(q.options) || q.options.length !== 4) throw new Error(`Item ${idx}: options deve ter 4 itens`);
  if (!q.options.every(isNonEmptyString)) throw new Error(`Item ${idx}: options contém item vazio`);
  if (!isNonEmptyString(q.correct_answer)) throw new Error(`Item ${idx}: correct_answer inválido`);
  if (!q.options.includes(q.correct_answer)) throw new Error(`Item ${idx}: correct_answer não está em options`);
  if (!isNonEmptyString(q.explanation)) throw new Error(`Item ${idx}: explanation inválida`);
}

async function main() {
  const raw = fs.readFileSync(path.resolve(file), "utf8");
  const items = JSON.parse(raw);

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("JSON deve ser um array com perguntas.");
  }

  // valida tudo
  items.forEach((q, idx) => validateQuestion(q, idx));

  // prepara para o esquema do seu banco
  const rows = items.map((q) => ({
    book: normalize(q.book),
    stage: normalize(q.stage),
    level: normalize(q.level),
    difficulty: q.difficulty,
    question: normalize(q.question),
    options: q.options, // supabase aceita json direto
    correct_answer: q.correct_answer,
    explanation: normalize(q.explanation),
    verse_ref: q.verse_ref ? normalize(q.verse_ref) : null, // se você criou a coluna
    status: "approved", // ou "pending" se quiser revisar antes
  }));

  // insere em chunks (evita payload grande)
  const chunkSize = 100;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from("questions").insert(chunk);
    if (error) throw new Error(`Erro ao inserir chunk ${i}-${i + chunk.length}: ${error.message}`);
    inserted += chunk.length;
    console.log(`✅ Inseridas: ${inserted}/${rows.length}`);
  }

  console.log("🎉 Import concluído!");
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
