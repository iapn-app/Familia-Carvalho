import { createClient } from "@supabase/supabase-js"

// Use define replacement from vite.config.ts, or fallback to import.meta.env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || ""

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase URL or Key is missing. Please check your .env file or environment variables.")
  // Log redacted values for debugging
  console.log("Supabase Config:", {
    url: supabaseUrl ? "Found" : "Missing",
    key: supabaseKey ? "Found" : "Missing"
  })
}

// Create client only if URL is present to avoid crash on import
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseKey || "placeholder-key"
)

export const isConfigured = !!supabaseUrl && !!supabaseKey;
