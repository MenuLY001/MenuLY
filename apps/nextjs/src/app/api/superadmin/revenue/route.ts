import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSuperAdminContext } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await getSuperAdminContext(req);

    // 1. Get all active subscriptions and their plans
    const { data: subs, error: subsErr } = await supabaseAdmin
      .from('subscriptions')
      .select('*, restaurant:restaurants(name, slug), plan:plans(price_paise)')
      .in('status', ['active', 'authenticated', 'pending']);
      
    if (subsErr) throw subsErr;

    // 2. Get recent payments
    const { data: payments, error: payErr } = await supabaseAdmin
      .from('payments')
      .select('*, restaurant:restaurants(name, slug)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (payErr) throw payErr;

    // Calculate MRR
    let mrrPaise = 0;
    const activeSubs = [];
    const expiringSoon = [];
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    for (const sub of (subs || [])) {
      if (sub.status === 'active' || sub.status === 'authenticated') {
        mrrPaise += sub.plan?.price_paise || 0;
        activeSubs.push(sub);
      }
      
      if (sub.current_period_end) {
        const endDate = new Date(sub.current_period_end);
        if (endDate < nextWeek && sub.status !== 'cancelled') {
          expiringSoon.push(sub);
        }
      }
    }

    return NextResponse.json({
      mrrPaise,
      activeSubsCount: activeSubs.length,
      expiringSoon,
      payments: payments || []
    });

  } catch (err) {
    if (err instanceof Response) return err;
    console.error('Failed to load revenue data:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
