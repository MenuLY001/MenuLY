import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { PublicMenuResponse } from '@qr-menu/types';

const router = Router();

// Statuses that allow the public menu to be served.
// past_due is included for the 7-day grace period.
const ACTIVE_STATUSES = ['trialing', 'active', 'past_due'];

/**
 * GET /api/menu/:slug
 *
 * Public endpoint — no authentication required.
 * restaurant_id is derived ONLY from the slug lookup — never from client input.
 * Returns 404 for unknown slugs.
 * Returns { unavailable: true } (HTTP 200) for suspended/cancelled restaurants
 * so search engines keep the URL indexed.
 */
router.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  const { slug } = req.params;

  // 1. Resolve restaurant by slug — this is the only source of restaurant_id
  const { data: restaurant, error: restError } = await supabaseAdmin
    .from('restaurants')
    .select('id, name, logo_url, theme_color, ordering_enabled, menu_template, status')
    .eq('slug', slug)
    .single();

  if (restError || !restaurant) {
    res.status(404).json({ error: 'Restaurant not found' });
    return;
  }

  // 2. Check subscription status — gate the menu behind active/trialing/past_due
  if (!ACTIVE_STATUSES.includes(restaurant.status)) {
    // Return a clean "unavailable" response — NOT 404 so the slug stays indexed
    res.status(200).json({
      unavailable: true,
      reason: 'subscription_inactive',
      restaurant: { name: restaurant.name },
    });
    return;
  }

  const restaurantId = restaurant.id; // derived from slug, never from client

  // 3. Fetch categories scoped strictly to this restaurant_id
  const { data: categories, error: catError } = await supabaseAdmin
    .from('categories')
    .select('id, name, sort_order')
    .eq('restaurant_id', restaurantId)
    .order('sort_order', { ascending: true });

  if (catError) {
    res.status(500).json({ error: 'Failed to fetch categories' });
    return;
  }

  // 4. Fetch available menu items scoped strictly to this restaurant_id
  const { data: items, error: itemsError } = await supabaseAdmin
    .from('menu_items')
    .select('id, restaurant_id, category_id, name, description, price, image_url, is_available, is_veg, is_special, sort_order')
    .eq('restaurant_id', restaurantId)
    .eq('is_available', true)
    .order('sort_order', { ascending: true });

  if (itemsError) {
    res.status(500).json({ error: 'Failed to fetch menu items' });
    return;
  }

  // 5. Nest items under their categories
  const categoriesWithItems = (categories ?? []).map((cat) => ({
    ...cat,
    restaurant_id: restaurantId,
    items: (items ?? []).filter((item) => item.category_id === cat.id),
  }));

  // Omit `status` from the public response — clients don't need it
  const { status: _status, ...restaurantPublic } = restaurant;
  const response: PublicMenuResponse = {
    restaurant: restaurantPublic,
    categories: categoriesWithItems,
  };

  res.json(response);
});

export default router;
