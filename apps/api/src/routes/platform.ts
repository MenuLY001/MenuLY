import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase';
import { nanoid } from 'nanoid';

const router = Router({ mergeParams: true });

// ─── Request schemas ──────────────────────────────────────────────────────────

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  // Restaurant fields — either provide an existing ID OR fields to create a new one
  restaurant_id: z.string().uuid().optional(),
  restaurant_name: z.string().min(2).max(120).optional(),
  restaurant_slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only').optional(),
  theme_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().default('#e67e22'),
}).refine(
  (data) => data.restaurant_id || (data.restaurant_name && data.restaurant_slug),
  { message: 'Provide either restaurant_id (to link to existing) or restaurant_name + restaurant_slug (to create new).' }
);

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ─── POST /register ───────────────────────────────────────────────────────────
/**
 * Platform owner route: create a restaurant admin.
 *
 * Cases:
 *   A) restaurant_id supplied  → link new user to existing restaurant
 *   B) restaurant_name + slug  → create restaurant first, then link new user
 *
 * Uses service-role key so RLS is bypassed intentionally.
 * This route is NOT mounted in the public Express app — only mounted
 * under a secret key path defined in PLATFORM_REGISTRATION_KEY env var.
 */
router.post('/register', async (req: Request, res: Response) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
  }

  const { email, password, restaurant_id, restaurant_name, restaurant_slug, theme_color } = parsed.data;

  let targetRestaurantId = restaurant_id;

  // ── Case B: create new restaurant ─────────────────────────────────────────
  if (!targetRestaurantId) {
    // Slug uniqueness check
    const { data: existing } = await supabaseAdmin
      .from('restaurants')
      .select('id')
      .eq('slug', restaurant_slug!)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ error: `A restaurant with slug "${restaurant_slug}" already exists.` });
    }

    const { data: newRestaurant, error: restError } = await supabaseAdmin
      .from('restaurants')
      .insert({ slug: restaurant_slug!, name: restaurant_name!, theme_color })
      .select('id')
      .single();

    if (restError || !newRestaurant) {
      console.error('[Platform/register] Failed to create restaurant:', restError);
      return res.status(500).json({ error: 'Failed to create restaurant' });
    }

    targetRestaurantId = newRestaurant.id;
  } else {
    // ── Case A: verify existing restaurant exists ────────────────────────────
    const { data: existingRestaurant } = await supabaseAdmin
      .from('restaurants')
      .select('id, name')
      .eq('id', targetRestaurantId)
      .maybeSingle();

    if (!existingRestaurant) {
      return res.status(404).json({ error: `Restaurant with id "${targetRestaurantId}" not found.` });
    }
  }

  // ── Create Supabase Auth user ────────────────────────────────────────────────
  const { data: userRecord, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skip email verification — platform owner creates trusted users
  });

  if (authError || !userRecord.user) {
    console.error('[Platform/register] Failed to create auth user:', authError);
    // Supabase returns "User already registered" if email exists
    const msg = authError?.message ?? 'Failed to create user';
    return res.status(400).json({ error: msg });
  }

  const userId = userRecord.user.id;

  // ── Link user → restaurant ────────────────────────────────────────────────
  const { error: linkError } = await supabaseAdmin
    .from('restaurant_admins')
    .insert({ user_id: userId, restaurant_id: targetRestaurantId });

  if (linkError) {
    // Roll back: delete the auth user we just created to avoid orphaned accounts
    await supabaseAdmin.auth.admin.deleteUser(userId);
    console.error('[Platform/register] Failed to link admin, rolled back user creation:', linkError);
    return res.status(500).json({ error: 'Failed to link admin to restaurant' });
  }

  // ── Fetch restaurant details for response ──────────────────────────────────
  const { data: restaurant } = await supabaseAdmin
    .from('restaurants')
    .select('id, slug, name, theme_color')
    .eq('id', targetRestaurantId)
    .single();

  return res.status(201).json({
    message: 'Admin created and linked successfully.',
    user: { id: userId, email },
    restaurant,
  });
});

// ─── POST /login ──────────────────────────────────────────────────────────────
/**
 * Platform owner shortcut: get a session token for any admin account.
 * Returns the access_token that the admin can paste into the web app login.
 *
 * In normal operation, admins log in via the frontend (/admin).
 * This endpoint is for the platform owner to verify credentials & debug.
 */
router.post('/login', async (req: Request, res: Response) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
  }

  const { email, password } = parsed.data;

  const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Look up which restaurant this admin manages
  const { data: adminRecord } = await supabaseAdmin
    .from('restaurant_admins')
    .select('restaurant_id, restaurants(id, slug, name)')
    .eq('user_id', data.user.id)
    .maybeSingle();

  return res.json({
    access_token: data.session.access_token,
    expires_at: data.session.expires_at,
    user: { id: data.user.id, email: data.user.email },
    restaurant: adminRecord?.restaurants ?? null,
  });
});

export default router;
