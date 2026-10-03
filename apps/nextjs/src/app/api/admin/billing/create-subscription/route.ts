import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getAdminContext } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error('Razorpay keys not configured');
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export async function POST(req: NextRequest) {
  try {
    const { restaurantId } = await getAdminContext(req);

    const { data: restaurant } = await supabaseAdmin
      .from('restaurants').select('id, name, slug, status').eq('id', restaurantId).single();

    if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    if (restaurant.status === 'cancelled') {
      return NextResponse.json({ error: 'This account has been cancelled.' }, { status: 400 });
    }

    // Return existing active subscription if any
    const { data: existingSub } = await supabaseAdmin
      .from('subscriptions').select('id, status, razorpay_subscription_id')
      .eq('restaurant_id', restaurantId)
      .in('status', ['created', 'authenticated', 'active', 'pending'])
      .maybeSingle();

    if (existingSub) {
      return NextResponse.json({
        subscription_id: existingSub.razorpay_subscription_id,
        key_id: process.env.RAZORPAY_KEY_ID,
        existing: true,
      });
    }

    // Get active plan
    const { data: plan } = await supabaseAdmin
      .from('plans').select('id, razorpay_plan_id, name, price_paise')
      .eq('is_active', true).order('created_at', { ascending: true }).limit(1).single();

    if (!plan) return NextResponse.json({ error: 'No active plan found.' }, { status: 500 });
    if (!plan.razorpay_plan_id) {
      return NextResponse.json({ error: 'Payment not configured. Contact support.', code: 'RAZORPAY_PLAN_NOT_CONFIGURED' }, { status: 503 });
    }

    // Create Razorpay subscription
    let razorpaySubscription: { id: string };
    try {
      const rzp = getRazorpay();
      razorpaySubscription = await rzp.subscriptions.create({
        plan_id: plan.razorpay_plan_id,
        total_count: 120,
        quantity: 1,
        customer_notify: 1,
        notes: {
          restaurant_id: restaurantId,
          restaurant_name: restaurant.name,
          restaurant_slug: restaurant.slug,
        },
      } as Parameters<typeof rzp.subscriptions.create>[0]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      console.error('[create-subscription] Razorpay error:', msg);
      return NextResponse.json({ error: `Failed to create subscription: ${msg}` }, { status: 502 });
    }

    // Store in DB
    await supabaseAdmin.from('subscriptions').insert({
      restaurant_id: restaurantId,
      plan_id: plan.id,
      status: 'created',
      razorpay_subscription_id: razorpaySubscription.id,
    });

    return NextResponse.json({
      subscription_id: razorpaySubscription.id,
      key_id: process.env.RAZORPAY_KEY_ID,
      existing: false,
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
