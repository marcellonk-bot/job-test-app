import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasSupabaseConfig = !!supabaseUrl && !!supabaseKey;

if (!hasSupabaseConfig) {
  console.error('Missing Supabase environment variables. Please check your .env.local or Vercel settings.');
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.com', supabaseKey || 'placeholder');
