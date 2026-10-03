import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-admin';

const TRIAL_DAYS = 7;

const RESERVED_SLUGS = new Set([
  'admin', 'superadmin', 'super-admin', 'api', 'login', 'logout',
  'register', 'signup', 'app', 'www', 'dashboard', 'billing',
  'settings', 'webhook', 'webhooks', 'health', 'auth', 'me',
  'account', 'subscription', 'payment', 'checkout', 'status',
  'support', 'help', 'about', 'contact', 'pricing', 'terms',
  'privacy', 'null', 'undefined', 'test', 'demo', 'menuly',
  'platform', 'static', 'assets', 'public',
]);

const schema = z.object({
  restaurant_name: z.string().min(2).max(100),
  restaurant_slug: z.string().min(2).max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { restaurant_name, restaurant_slug, email, password } = parsed.data;

    if (RESERVED_SLUGS.has(restaurant_slug)) {
      return NextResponse.json({ error: `"${restaurant_slug}" is a reserved slug.` }, { status: 400 });
    }

    // Check slug uniqueness
    const { data: existing } = await supabaseAdmin
      .from('restaurants').select('id').eq('slug', restaurant_slug).maybeSingle();
    if (existing) {
      return NextResponse.json({ error: 'This slug is already taken. Please choose another.' }, { status: 409 });
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true,
    });
    if (authError || !authData.user) {
      const msg = authError?.message ?? 'Failed to create user';
      if (msg.includes('already registered')) {
        return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
      }
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const userId = authData.user.id;
    const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();

    // Create restaurant
    const { data: restaurant, error: restError } = await supabaseAdmin
      .from('restaurants')
      .insert({
        name: restaurant_name, slug: restaurant_slug,
        status: 'trialing', trial_ends_at: trialEndsAt,
      })
      .select('id, slug, name, theme_color, status, trial_ends_at')
      .single();

    if (restError || !restaurant) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: 'Failed to create restaurant.' }, { status: 500 });
    }

    // Link user to restaurant
    const { error: linkError } = await supabaseAdmin.from('restaurant_admins').insert({
      user_id: userId, restaurant_id: restaurant.id,
    });

    if (linkError) {
      // Full rollback: remove restaurant and auth user to prevent orphaned records
      await supabaseAdmin.from('restaurants').delete().eq('id', restaurant.id);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: 'Failed to link account. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Account created successfully.',
      user: { id: userId, email },
      restaurant,
      trial_ends_at: trialEndsAt,
      trial_days: TRIAL_DAYS,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
