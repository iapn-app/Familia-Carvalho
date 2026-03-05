
import { createClient } from '@supabase/supabase-js';

// Access via process.env which is polyfilled/replaced by Vite define
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Debug log (will show in browser console)
console.log('Supabase Config:', { 
  url: supabaseUrl ? 'Found' : 'Missing', 
  key: supabaseAnonKey ? 'Found' : 'Missing' 
});

if (!supabaseUrl || !supabaseAnonKey) {
  // Fallback for development if needed, or throw
  throw new Error('Missing Supabase environment variables. Please check your .env file or system configuration.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
