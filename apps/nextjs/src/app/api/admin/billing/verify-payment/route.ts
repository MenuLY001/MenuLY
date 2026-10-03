import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminContext } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    const { restaurantId } = await getAdminContext(req);
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } =
      await req.json() as { razorpay_payment_id?: string; razorpay_subscription_id?: string; razorpay_signature?: string };

    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing Razorpay payment fields.' }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) return NextResponse.json({ error: 'Payment verification not configured.' }, { status: 500 });

    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return NextResponse.json({ error: 'Payment verification failed. Invalid signature.' }, { status: 400 });
    }

    await supabaseAdmin.from('subscriptions')
      .update({ status: 'authenticated' })
      .eq('razorpay_subscription_id', razorpay_subscription_id)
      .eq('restaurant_id', restaurantId);

    await supabaseAdmin.from('restaurants')
      .update({ status: 'active', trial_ends_at: null })
      .eq('id', restaurantId);

    await supabaseAdmin.from('payments').insert({
      restaurant_id: restaurantId,
      razorpay_payment_id,
      razorpay_subscription_id,
      amount_paise: 0,
      currency: 'INR',
      status: 'captured',
    });

    return NextResponse.json({ success: true, message: 'Payment verified. Subscription is now active.' });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
