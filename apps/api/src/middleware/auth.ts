import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { AdminContext } from '@qr-menu/types';

declare global {
  namespace Express {
    interface Request {
      adminContext?: AdminContext;
    }
  }
}

/**
 * Extracts the Bearer JWT from the Authorization header, verifies it with
 * Supabase, then resolves the caller's restaurant_id from restaurant_admins.
 *
 * restaurant_id is NEVER taken from the request body or query params —
 * only from the verified JWT → restaurant_admins lookup.
 */
export async function requireAdminAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.slice(7);

  // Verify the JWT via Supabase Auth
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  // Resolve restaurant_id from the mapping table — derive from JWT, not client
  const { data: adminRow, error: adminError } = await supabaseAdmin
    .from('restaurant_admins')
    .select('restaurant_id')
    .eq('user_id', user.id)
    .single();

  if (adminError || !adminRow) {
    res.status(403).json({ error: 'No restaurant associated with this account' });
    return;
  }

  req.adminContext = {
    userId: user.id,
    restaurantId: adminRow.restaurant_id,
  };

  next();
}
