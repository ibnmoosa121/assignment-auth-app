import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL is not set.');
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set. Please check your .env.local file and restart the server.');
}

if (!supabaseAnonKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_ANON_KEY is not set.');
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Please check your .env.local file and restart the server.');
}

// Create the Supabase client with redirect options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    // Use the Vercel URL for production redirects
    redirectTo: 'https://assignment-auth-app.vercel.app/auth'
  }
});
