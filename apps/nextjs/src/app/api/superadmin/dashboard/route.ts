import { NextRequest, NextResponse } from 'next/server';
import { getSuperAdminContext } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await getSuperAdminContext(req);
    void userId;

    const [
      { data: restaurants },
      { data: subscriptions },
      { data: payments },
      { count: totalUsers },
    ] = await Promise.all([
      supabaseAdmin.from('restaurants').select('id, name, slug, status, trial_ends_at, created_at').order('created_at', { ascending: false }),
      supabaseAdmin.from('subscriptions').select('restaurant_id, status, razorpay_subscription_id, current_period_end'),
      supabaseAdmin.from('payments').select('restaurant_id, amount_paise, status, created_at').eq('status', 'captured').order('created_at', { ascending: false }).limit(50),
      supabaseAdmin.from('restaurant_admins').select('*', { count: 'exact', head: true }),
    ]);

    const subMap = new Map((subscriptions ?? []).map(s => [s.restaurant_id, s]));
    const restaurantRows = (restaurants ?? []).map(r => ({ ...r, subscription: subMap.get(r.id) ?? null }));

    const totalRevenuePaise = (payments ?? []).reduce((sum, p) => sum + (p.amount_paise ?? 0), 0);

    return NextResponse.json({
      stats: {
        totalRestaurants: restaurantRows.length,
        activeCount:   restaurantRows.filter(r => r.status === 'active').length,
        trialCount:    restaurantRows.filter(r => r.status === 'trialing').length,
        suspendedCount: restaurantRows.filter(r => r.status === 'suspended').length,
        totalAdmins: totalUsers ?? 0,
        totalRevenuePaise,
      },
      restaurants: restaurantRows,
      recentPayments: payments ?? [],
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
