import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Supabase] Missing SUPABASE_URL or SUPABASE_ANON_KEY.\n' +
    'Copy apps/web/.env.example to apps/web/.env and fill in your values.'
  );
}

/**
 * Anon key Supabase client — for authentication only (admin login).
 * All data fetching goes through the API (server-side, service-role).
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
