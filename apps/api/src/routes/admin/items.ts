import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAdminAuth } from '../../middleware/auth';
import { supabaseAdmin } from '../../lib/supabase';

const router = Router();
router.use(requireAdminAuth);

const createSchema = z.object({
  category_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  price: z.number().positive(),
  image_url: z.string().url().optional().nullable(),
  is_available: z.boolean().optional().default(true),
  is_veg: z.boolean().optional().nullable(),
  is_special: z.boolean().optional().default(false),
  sort_order: z.number().int().min(0).optional(),
});

const updateSchema = createSchema.partial().omit({ category_id: true }).extend({
  category_id: z.string().uuid().optional(),
});

/**
 * GET /api/admin/items
 * All menu items for admin's restaurant (includes unavailable items).
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { restaurantId } = req.adminContext!;

  const { data, error } = await supabaseAdmin
    .from('menu_items')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('sort_order', { ascending: true });

  if (error) {
    res.status(500).json({ error: 'Failed to fetch items' });
    return;
  }
  res.json(data);
});

/**
 * POST /api/admin/items
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { restaurantId } = req.adminContext!;
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  // Verify the category_id belongs to admin's restaurant
  const { data: cat } = await supabaseAdmin
    .from('categories')
    .select('id')
    .eq('id', parsed.data.category_id)
    .eq('restaurant_id', restaurantId)
    .single();

  if (!cat) {
    res.status(400).json({ error: 'Invalid category_id for this restaurant' });
    return;
  }

  let sortOrder = parsed.data.sort_order;
  if (sortOrder === undefined) {
    const { data: existing } = await supabaseAdmin
      .from('menu_items')
      .select('sort_order')
      .eq('restaurant_id', restaurantId)
      .order('sort_order', { ascending: false })
      .limit(1);
    sortOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;
  }

  const { data, error } = await supabaseAdmin
    .from('menu_items')
    .insert({ ...parsed.data, restaurant_id: restaurantId, sort_order: sortOrder })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: 'Failed to create item' });
    return;
  }
  res.status(201).json(data);
});

/**
 * PATCH /api/admin/items/:id
 */
router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  const { restaurantId } = req.adminContext!;
  const { id } = req.params;
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  // If category_id is being changed, verify it belongs to this restaurant
  if (parsed.data.category_id) {
    const { data: cat } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('id', parsed.data.category_id)
      .eq('restaurant_id', restaurantId)
      .single();
    if (!cat) {
      res.status(400).json({ error: 'Invalid category_id for this restaurant' });
      return;
    }
  }

  const { data, error } = await supabaseAdmin
    .from('menu_items')
    .update(parsed.data)
    .eq('id', id)
    .eq('restaurant_id', restaurantId) // Isolation: only update own rows
    .select()
    .single();

  if (error || !data) {
    res.status(404).json({ error: 'Item not found or access denied' });
    return;
  }
  res.json(data);
});

/**
 * DELETE /api/admin/items/:id
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const { restaurantId } = req.adminContext!;
  const { id } = req.params;

  const { error, count } = await supabaseAdmin
    .from('menu_items')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('restaurant_id', restaurantId); // Isolation: only delete own rows

  if (error || count === 0) {
    res.status(404).json({ error: 'Item not found or access denied' });
    return;
  }
  res.status(204).send();
});

export default router;
