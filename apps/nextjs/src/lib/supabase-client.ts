'use client';
/**
 * Browser Supabase client — uses only the anon key (safe to expose).
 * Import this in Client Components for auth session management.
 */
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
