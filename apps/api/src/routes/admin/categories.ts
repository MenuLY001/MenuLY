import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAdminAuth } from '../../middleware/auth';
import { supabaseAdmin } from '../../lib/supabase';

const router = Router();

// All routes require admin authentication
router.use(requireAdminAuth);

const createSchema = z.object({
  name: z.string().min(1).max(100),
  sort_order: z.number().int().min(0).optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  sort_order: z.number().int().min(0).optional(),
});

/**
 * GET /api/admin/categories
 * List all categories for the authenticated admin's restaurant.
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { restaurantId } = req.adminContext!;

  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('sort_order', { ascending: true });

  if (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
    return;
  }
  res.json(data);
});

/**
 * POST /api/admin/categories
 * Create a new category scoped to the admin's restaurant.
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { restaurantId } = req.adminContext!;
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  // Get current max sort_order if not supplied
  let sortOrder = parsed.data.sort_order;
  if (sortOrder === undefined) {
    const { data: existing } = await supabaseAdmin
      .from('categories')
      .select('sort_order')
      .eq('restaurant_id', restaurantId)
      .order('sort_order', { ascending: false })
      .limit(1);
    sortOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;
  }

  const { data, error } = await supabaseAdmin
    .from('categories')
    .insert({ restaurant_id: restaurantId, name: parsed.data.name, sort_order: sortOrder })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: 'Failed to create category' });
    return;
  }
  res.status(201).json(data);
});

/**
 * PATCH /api/admin/categories/:id
 * Update a category — verifies it belongs to admin's restaurant before update.
 */
router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  const { restaurantId } = req.adminContext!;
  const { id } = req.params;
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('categories')
    .update(parsed.data)
    .eq('id', id)
    .eq('restaurant_id', restaurantId) // Isolation: only update own rows
    .select()
    .single();

  if (error || !data) {
    res.status(404).json({ error: 'Category not found or access denied' });
    return;
  }
  res.json(data);
});

/**
 * DELETE /api/admin/categories/:id
 * Delete a category — verifies it belongs to admin's restaurant.
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const { restaurantId } = req.adminContext!;
  const { id } = req.params;

  const { error, count } = await supabaseAdmin
    .from('categories')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('restaurant_id', restaurantId); // Isolation: only delete own rows

  if (error || count === 0) {
    res.status(404).json({ error: 'Category not found or access denied' });
    return;
  }
  res.status(204).send();
});

export default router;
