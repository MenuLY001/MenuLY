import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { PublicMenuResponse } from '@qr-menu/types';

const router = Router();

/**
 * GET /api/menu/:slug
 *
 * Public endpoint — no authentication required.
 * restaurant_id is derived ONLY from the slug lookup — never from client input.
 * Returns 404 for unknown slugs; never falls through to another tenant's data.
 */
router.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  const { slug } = req.params;

  // 1. Resolve restaurant by slug — this is the only source of restaurant_id
  const { data: restaurant, error: restError } = await supabaseAdmin
    .from('restaurants')
    .select('id, name, logo_url, theme_color, ordering_enabled, menu_template')
    .eq('slug', slug)
    .single();

  if (restError || !restaurant) {
    res.status(404).json({ error: 'Restaurant not found' });
    return;
  }

  const restaurantId = restaurant.id; // derived from slug, never from client

  // 2. Fetch categories scoped strictly to this restaurant_id
  const { data: categories, error: catError } = await supabaseAdmin
    .from('categories')
    .select('id, name, sort_order')
    .eq('restaurant_id', restaurantId)
    .order('sort_order', { ascending: true });

  if (catError) {
    res.status(500).json({ error: 'Failed to fetch categories' });
    return;
  }

  // 3. Fetch available menu items scoped strictly to this restaurant_id
  const { data: items, error: itemsError } = await supabaseAdmin
    .from('menu_items')
    .select('id, restaurant_id, category_id, name, description, price, image_url, is_available, sort_order')
    .eq('restaurant_id', restaurantId)
    .eq('is_available', true)
    .order('sort_order', { ascending: true });

  if (itemsError) {
    res.status(500).json({ error: 'Failed to fetch menu items' });
    return;
  }

  // 4. Nest items under their categories
  const categoriesWithItems = (categories ?? []).map((cat) => ({
    ...cat,
    restaurant_id: restaurantId,
    items: (items ?? []).filter((item) => item.category_id === cat.id),
  }));

  const response: PublicMenuResponse = {
    restaurant,
    categories: categoriesWithItems,
  };

  res.json(response);
});

export default router;
