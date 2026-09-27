import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.\n' +
      'Copy apps/api/.env.example to apps/api/.env and fill in your values.'
  );
}

/**
 * Service-role Supabase client — bypasses RLS.
 * Used ONLY server-side. Never expose this client or key to the frontend.
 *
 * All admin mutations are gated at the route level by verifying the caller's
 * JWT maps to the correct restaurant_id via restaurant_admins table.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
