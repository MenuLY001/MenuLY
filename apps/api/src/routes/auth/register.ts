import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../../lib/supabase';

const router = Router();

// ─── Validation schemas ───────────────────────────────────────────────────────

const TRIAL_DAYS = 7; // configurable constant

const RESERVED_SLUGS = new Set([
  'admin', 'superadmin', 'super-admin', 'api', 'login', 'logout',
  'register', 'signup', 'app', 'www', 'dashboard', 'billing',
  'settings', 'webhook', 'webhooks', 'health', 'auth', 'me',
  'account', 'subscription', 'payment', 'checkout', 'status',
  'support', 'help', 'about', 'contact', 'pricing', 'terms',
  'privacy', 'null', 'undefined', 'test', 'demo', 'menuly',
  'platform', 'static', 'assets', 'public',
]);

const RegisterSchema = z.object({
  restaurant_name: z.string().min(2).max(120).trim(),
  restaurant_slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only')
    .trim(),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

// ─── POST /api/auth/register ─────────────────────────────────────────────────
/**
 * Public self-serve restaurant registration.
 *
 * Flow:
 *   1. Validate input
 *   2. Check slug (reserved + uniqueness)
 *   3. Create Supabase auth user
 *   4. Create restaurant (status: trialing, trial_ends_at: now + 7 days)
 *   5. Link user → restaurant in restaurant_admins
 *   6. Sign in user to get a session token
 *   7. Return token + restaurant so the frontend can log in immediately
 *
 * The Razorpay subscription is created separately via POST /api/admin/billing/create-subscription
 * so the user can complete payment setup from the admin dashboard.
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
    return;
  }

  const { restaurant_name, restaurant_slug, email, password } = parsed.data;

  // 1. Check reserved slugs (also enforced by DB trigger; this gives a better error message)
  if (RESERVED_SLUGS.has(restaurant_slug)) {
    res.status(409).json({ error: `The slug "${restaurant_slug}" is reserved. Please choose a different one.` });
    return;
  }

  // 2. Check slug uniqueness
  const { data: existingSlug } = await supabaseAdmin
    .from('restaurants')
    .select('id')
    .eq('slug', restaurant_slug)
    .maybeSingle();

  if (existingSlug) {
    res.status(409).json({ error: `The slug "${restaurant_slug}" is already taken. Please choose a different one.` });
    return;
  }

  // 3. Check email not already registered
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  const emailTaken = existingUsers?.users?.some(u => u.email === email);
  if (emailTaken) {
    res.status(409).json({ error: 'An account with this email already exists. Please sign in instead.' });
    return;
  }

  // 4. Create Supabase auth user
  const { data: userRecord, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skip email verification for now
  });

  if (authError || !userRecord.user) {
    console.error('[Auth/register] Failed to create auth user:', authError);
    res.status(400).json({ error: authError?.message ?? 'Failed to create account' });
    return;
  }

  const userId = userRecord.user.id;

  // 5. Create restaurant with 7-day trial
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

  const { data: restaurant, error: restError } = await supabaseAdmin
    .from('restaurants')
    .insert({
      slug: restaurant_slug,
      name: restaurant_name,
      status: 'trialing',
      trial_ends_at: trialEndsAt.toISOString(),
    })
    .select('id, slug, name, theme_color, status, trial_ends_at')
    .single();

  if (restError || !restaurant) {
    // Roll back: delete the auth user to avoid orphaned accounts
    await supabaseAdmin.auth.admin.deleteUser(userId);
    console.error('[Auth/register] Failed to create restaurant:', restError);
    res.status(500).json({ error: 'Failed to create restaurant. Please try again.' });
    return;
  }

  // 6. Link user → restaurant
  const { error: linkError } = await supabaseAdmin
    .from('restaurant_admins')
    .insert({ user_id: userId, restaurant_id: restaurant.id });

  if (linkError) {
    // Roll back both
    await supabaseAdmin.auth.admin.deleteUser(userId);
    await supabaseAdmin.from('restaurants').delete().eq('id', restaurant.id);
    console.error('[Auth/register] Failed to link admin:', linkError);
    res.status(500).json({ error: 'Failed to set up account. Please try again.' });
    return;
  }

  res.status(201).json({
    message: 'Account created successfully.',
    access_token: null,
    expires_at: undefined,
    user: { id: userId, email },
    restaurant,
    trial_ends_at: trialEndsAt.toISOString(),
    trial_days: TRIAL_DAYS,
  });
});

export default router;
