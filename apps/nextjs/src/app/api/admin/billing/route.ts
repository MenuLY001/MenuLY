import { NextRequest, NextResponse } from 'next/server';
import { getAdminContext } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/admin/billing
export async function GET(req: NextRequest) {
  try {
    const { restaurantId } = await getAdminContext(req);

    const { data: restaurant } = await supabaseAdmin
      .from('restaurants').select('status, trial_ends_at').eq('id', restaurantId).single();

    if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });

    const { data: subscription } = await supabaseAdmin
      .from('subscriptions').select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();

    let plan = null;
    if (subscription?.plan_id) {
      const { data } = await supabaseAdmin.from('plans').select('*').eq('id', subscription.plan_id).maybeSingle();
      plan = data;
    }

    const { data: payments } = await supabaseAdmin
      .from('payments').select('*').eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false }).limit(20);

    return NextResponse.json({
      status: restaurant.status,
      trial_ends_at: restaurant.trial_ends_at,
      subscription: subscription ?? null,
      plan,
      payments: payments ?? [],
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/billing/create-subscription  (handled in sub-route)
