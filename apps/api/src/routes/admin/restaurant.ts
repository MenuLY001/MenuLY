import { Router, Request, Response } from 'express';
import { requireAdminAuth } from '../../middleware/auth';
import { supabaseAdmin } from '../../lib/supabase';

const router = Router();
router.use(requireAdminAuth);

/**
 * GET /api/admin/restaurant
 * Returns the authenticated admin's restaurant details.
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { restaurantId } = req.adminContext!;

  const { data, error } = await supabaseAdmin
    .from('restaurants')
    .select('*')
    .eq('id', restaurantId)
    .single();

  if (error || !data) {
    res.status(404).json({ error: 'Restaurant not found' });
    return;
  }
  res.json(data);
});

/**
 * PATCH /api/admin/restaurant
 * Update restaurant details (name, logo_url, theme_color).
 * restaurant_id is always from the JWT, never from the body.
 */
router.patch('/', async (req: Request, res: Response): Promise<void> => {
  const { restaurantId } = req.adminContext!;

  // Whitelist only updateable fields — never allow slug/id changes
  const { name, logo_url, theme_color } = req.body as {
    name?: string;
    logo_url?: string;
    theme_color?: string;
  };

  const updates: Record<string, unknown> = {};
  if (name) updates.name = name;
  if (logo_url !== undefined) updates.logo_url = logo_url;
  if (theme_color) updates.theme_color = theme_color;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: 'No valid fields to update' });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('restaurants')
    .update(updates)
    .eq('id', restaurantId) // Isolation: only update own restaurant
    .select()
    .single();

  if (error || !data) {
    res.status(500).json({ error: 'Failed to update restaurant' });
    return;
  }
  res.json(data);
});

export default router;
