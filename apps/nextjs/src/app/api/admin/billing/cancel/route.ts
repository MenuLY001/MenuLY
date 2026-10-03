import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getAdminContext } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    const { restaurantId } = await getAdminContext(req);

    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .select('id, razorpay_subscription_id, status')
      .eq('restaurant_id', restaurantId)
      .in('status', ['authenticated', 'active'])
      .order('created_at', { ascending: false })
      .limit(1).maybeSingle();

    if (!sub?.razorpay_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found.' }, { status: 404 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) return NextResponse.json({ error: 'Razorpay not configured' }, { status: 500 });

    try {
      const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
      await rzp.subscriptions.cancel(sub.razorpay_subscription_id, true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      return NextResponse.json({ error: `Failed to cancel: ${msg}` }, { status: 502 });
    }

    await supabaseAdmin.from('subscriptions')
      .update({ cancel_at_period_end: true }).eq('id', sub.id);

    return NextResponse.json({ success: true, message: 'Subscription will be cancelled at end of billing period.' });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
