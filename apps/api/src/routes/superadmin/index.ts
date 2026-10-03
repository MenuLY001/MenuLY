import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../../lib/supabase';

/**
 * Super Admin Routes — /api/superadmin/*
 *
 * Protected by requireSuperAdmin middleware:
 *   1. Valid Supabase JWT
 *   2. user_id must exist in the super_admins table
 *
 * Never exposed to restaurant admins.
 */
const router = Router();

// ─── Middleware: verify caller is a super admin ───────────────────────────────
async function requireSuperAdmin(req: Request, res: Response, next: Function): Promise<void> {
  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  const { data: superAdmin } = await supabaseAdmin
    .from('super_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!superAdmin) {
    res.status(403).json({ error: 'Forbidden — super admin only' });
    return;
  }

  (req as Request & { superAdminId: string }).superAdminId = user.id;
  next();
}

router.use(requireSuperAdmin as any);

// ─── GET /api/superadmin/dashboard ────────────────────────────────────────────
/**
 * Returns platform-wide summary stats + all restaurants with billing status.
 */
router.get('/dashboard', async (_req: Request, res: Response): Promise<void> => {
  const [
    { data: restaurants },
    { data: subscriptions },
    { data: payments },
    { count: totalUsers },
  ] = await Promise.all([
    supabaseAdmin
      .from('restaurants')
      .select('id, name, slug, status, trial_ends_at, created_at')
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('subscriptions')
      .select('restaurant_id, status, razorpay_subscription_id, current_period_end'),
    supabaseAdmin
      .from('payments')
      .select('restaurant_id, amount_paise, status, created_at')
      .eq('status', 'captured')
      .order('created_at', { ascending: false })
      .limit(50),
    supabaseAdmin.from('restaurant_admins').select('*', { count: 'exact', head: true }),
  ]);

  // Build a map of restaurant_id → subscription
  const subMap = new Map((subscriptions ?? []).map(s => [s.restaurant_id, s]));

  const restaurantRows = (restaurants ?? []).map(r => ({
    ...r,
    subscription: subMap.get(r.id) ?? null,
  }));

  // Aggregate stats
  const totalRestaurants = restaurantRows.length;
  const activeCount  = restaurantRows.filter(r => r.status === 'active').length;
  const trialCount   = restaurantRows.filter(r => r.status === 'trialing').length;
  const suspendedCount = restaurantRows.filter(r => r.status === 'suspended').length;
  const totalRevenuePaise = (payments ?? []).reduce((sum, p) => sum + (p.amount_paise ?? 0), 0);

  res.json({
    stats: {
      totalRestaurants,
      activeCount,
      trialCount,
      suspendedCount,
      totalAdmins: totalUsers ?? 0,
      totalRevenuePaise,
    },
    restaurants: restaurantRows,
    recentPayments: payments ?? [],
  });
});

// ─── PATCH /api/superadmin/restaurants/:id/status ─────────────────────────────
/**
 * Manually override a restaurant's status (suspend, activate, cancel, etc.)
 */
router.patch('/restaurants/:id/status', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body as { status: string };

  const VALID = ['active', 'trialing', 'past_due', 'suspended', 'cancelled'];
  if (!VALID.includes(status)) {
    res.status(400).json({ error: `Invalid status. Must be one of: ${VALID.join(', ')}` });
    return;
  }

  const { error } = await supabaseAdmin
    .from('restaurants')
    .update({ status, ...(status !== 'trialing' ? { trial_ends_at: null } : {}) })
    .eq('id', id);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  // Log to audit_log
  await supabaseAdmin.from('audit_log').insert({
    actor_id:    (req as Request & { superAdminId: string }).superAdminId,
    actor_type:  'super_admin',
    action:      `restaurant.status_changed.${status}`,
    target_id:   id,
    target_type: 'restaurant',
    metadata:    { new_status: status },
  });

  res.json({ ok: true, status });
});

// ─── PATCH /api/superadmin/restaurants/:id/extend-trial ──────────────────────
/**
 * Extend a restaurant's trial by N days.
 */
router.patch('/restaurants/:id/extend-trial', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { days } = req.body as { days: number };

  if (!days || days < 1 || days > 365) {
    res.status(400).json({ error: 'days must be between 1 and 365' });
    return;
  }

  const newTrialEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabaseAdmin
    .from('restaurants')
    .update({ status: 'trialing', trial_ends_at: newTrialEnd })
    .eq('id', id);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  await supabaseAdmin.from('audit_log').insert({
    actor_id:    (req as Request & { superAdminId: string }).superAdminId,
    actor_type:  'super_admin',
    action:      'restaurant.trial_extended',
    target_id:   id,
    target_type: 'restaurant',
    metadata:    { days, new_trial_end: newTrialEnd },
  });

  res.json({ ok: true, trial_ends_at: newTrialEnd });
});

// ─── GET /api/superadmin/audit-log ───────────────────────────────────────────
router.get('/audit-log', async (_req: Request, res: Response): Promise<void> => {
  const { data } = await supabaseAdmin
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  res.json(data ?? []);
});

export default router;
