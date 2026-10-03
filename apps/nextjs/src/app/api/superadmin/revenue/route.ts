import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSuperAdminContext } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await getSuperAdminContext(req);

    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      { data: subs },
      { data: payments },
      { data: restaurants },
    ] = await Promise.all([
      supabaseAdmin
        .from('subscriptions')
        .select('*, restaurant:restaurants(id, name, slug, status), plan:plans(price_paise)'),
      supabaseAdmin
        .from('payments')
        .select('*, restaurant:restaurants(name, slug)')
        .order('created_at', { ascending: false })
        .limit(200),
      supabaseAdmin
        .from('restaurants')
        .select('id, name, slug, status, trial_ends_at, created_at')
        .order('created_at', { ascending: false }),
    ]);

    // ── MRR + active subs ─────────────────────────────────────────────────────
    let mrrPaise = 0;
    const activeSubs: typeof subs = [];
    const expiringSoon: typeof subs = [];

    for (const sub of (subs || [])) {
      if (sub.status === 'active' || sub.status === 'authenticated') {
        mrrPaise += sub.plan?.price_paise || 0;
        activeSubs.push(sub);
      }
      if (sub.current_period_end) {
        const endDate = new Date(sub.current_period_end);
        if (endDate < nextWeek && endDate > now && sub.status !== 'cancelled') {
          expiringSoon.push(sub);
        }
      }
    }

    // ── Churn & conversion ────────────────────────────────────────────────────
    const allRestaurants = restaurants || [];
    const signupsLast30 = allRestaurants.filter(
      r => new Date(r.created_at) > thirtyDaysAgo
    ).length;
    const signupsLast7 = allRestaurants.filter(
      r => new Date(r.created_at) > sevenDaysAgo
    ).length;

    // Trial → paid conversion: restaurants that have a captured payment
    const restaurantsWithPayment = new Set(
      (payments || []).filter(p => p.status === 'captured').map(p => p.restaurant_id)
    );
    const trialRestaurants = allRestaurants.filter(r => r.status === 'trialing');
    const convertedFromTrial = allRestaurants.filter(
      r => r.status === 'active' && restaurantsWithPayment.has(r.id)
    ).length;
    const totalEverTrialed = allRestaurants.filter(
      r => ['trialing', 'active', 'suspended', 'cancelled'].includes(r.status)
    ).length;
    const conversionRatePct = totalEverTrialed > 0
      ? Math.round((convertedFromTrial / totalEverTrialed) * 100)
      : 0;

    // Churned this month: cancelled or suspended in last 30 days (approximate via payments halted or status)
    const cancelledThisMonth = allRestaurants.filter(
      r => r.status === 'cancelled' || r.status === 'suspended'
    ).length;

    // Revenue last 30 days
    const revenueLast30 = (payments || [])
      .filter(p => p.status === 'captured' && new Date(p.created_at) > thirtyDaysAgo)
      .reduce((sum, p) => sum + (p.amount_paise ?? 0), 0);

    // ── Trials expiring in 3 days (for urgent nudge list) ─────────────────────
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const trialEndingUrgent = trialRestaurants.filter(r => {
      if (!r.trial_ends_at) return false;
      const end = new Date(r.trial_ends_at);
      return end > now && end <= threeDaysFromNow;
    });

    return NextResponse.json({
      mrrPaise,
      activeSubsCount: activeSubs.length,
      expiringSoon,
      payments: payments || [],
      // New churn/conversion stats
      stats: {
        signupsLast30,
        signupsLast7,
        convertedFromTrial,
        totalEverTrialed,
        conversionRatePct,
        cancelledThisMonth,
        revenueLast30,
        trialEndingUrgent,
      },
    });

  } catch (err) {
    if (err instanceof Response) return err;
    console.error('Failed to load revenue data:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
