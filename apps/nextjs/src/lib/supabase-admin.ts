/**
 * Server-only Supabase admin client.
 * Uses the service role key — NEVER import this in client components.
 * This file is automatically excluded from the client bundle because it
 * references server-only environment variables (no NEXT_PUBLIC_ prefix).
 *
 * NOTE: We do NOT throw at module load time because Next.js statically
 * analyses route modules during `next build`. A top-level throw would
 * crash the build even when env vars are injected at runtime (e.g. Vercel).
 * Validation is deferred to actual request time via the API routes themselves.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder';

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
