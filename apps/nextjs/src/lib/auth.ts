/**
 * Server-side auth helper.
 * Validates a Bearer token from the Authorization header using supabaseAdmin.
 * Returns the user or throws a Response with a 401 status.
 */
import { NextRequest } from 'next/server';
import { supabaseAdmin } from './supabase-admin';

export interface AdminContext {
  userId: string;
  restaurantId: string;
}

export interface SuperAdminContext {
  userId: string;
}

/** Verify JWT and return userId. Throws a 401 Response if invalid. */
export async function getAuthUser(req: NextRequest): Promise<{ userId: string }> {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) throw new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) throw new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });

  return { userId: user.id };
}

/** Verify JWT + restaurant_admins mapping. Returns restaurantId. */
export async function getAdminContext(req: NextRequest): Promise<AdminContext> {
  const { userId } = await getAuthUser(req);

  const { data: mapping } = await supabaseAdmin
    .from('restaurant_admins')
    .select('restaurant_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (!mapping) {
    throw new Response(JSON.stringify({ error: 'Forbidden — not a restaurant admin' }), { status: 403 });
  }

  return { userId, restaurantId: mapping.restaurant_id };
}

/** Verify JWT + super_admins table. */
export async function getSuperAdminContext(req: NextRequest): Promise<SuperAdminContext> {
  const { userId } = await getAuthUser(req);

  const { data: sa } = await supabaseAdmin
    .from('super_admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (!sa) {
    throw new Response(JSON.stringify({ error: 'Forbidden — super admin only' }), { status: 403 });
  }

  return { userId };
}
