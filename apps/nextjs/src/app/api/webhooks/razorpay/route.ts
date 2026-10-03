import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Helper: get subscription ID from Razorpay webhook payload
function getSubscriptionId(payload: Record<string, unknown>): string | null {
  const inner = payload['payload'] as Record<string, unknown>;
  const sub = (inner?.['subscription'] as Record<string, unknown>)?.['entity'] as Record<string, unknown>;
  return (sub?.['id'] as string) ?? null;
}

function getPaymentEntity(payload: Record<string, unknown>): Record<string, unknown> | null {
  const inner = payload['payload'] as Record<string, unknown>;
  const pay = inner?.['payment'] as Record<string, unknown>;
  return (pay?.['entity'] as Record<string, unknown>) ?? null;
}

async function getRestaurantIdBySubscription(subId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('subscriptions').select('restaurant_id').eq('razorpay_subscription_id', subId).maybeSingle();
  return data?.restaurant_id ?? null;
}

// ─── Event handlers ────────────────────────────────────────────────────────────

async function handleSubscriptionAuthenticated(payload: Record<string, unknown>) {
  const subId = getSubscriptionId(payload);
  if (!subId) return;
  const restaurantId = await getRestaurantIdBySubscription(subId);
  if (!restaurantId) return;
  await supabaseAdmin.from('subscriptions').update({ status: 'authenticated' }).eq('razorpay_subscription_id', subId);
  await supabaseAdmin.from('restaurants').update({ status: 'active', trial_ends_at: null }).eq('id', restaurantId);
}

async function handleSubscriptionCharged(payload: Record<string, unknown>) {
  const subId = getSubscriptionId(payload);
  if (!subId) return;
  const inner = payload['payload'] as Record<string, unknown>;
  const sub = (inner?.['subscription'] as Record<string, unknown>)?.['entity'] as Record<string, unknown>;
  const currentEnd = sub?.['current_end'] as number | undefined;
  const restaurantId = await getRestaurantIdBySubscription(subId);
  if (!restaurantId) return;
  await supabaseAdmin.from('subscriptions').update({
    status: 'active',
    current_period_start: new Date().toISOString(),
    current_period_end: currentEnd ? new Date(currentEnd * 1000).toISOString() : null,
  }).eq('razorpay_subscription_id', subId);
  await supabaseAdmin.from('restaurants').update({ status: 'active' }).eq('id', restaurantId);
}

async function handleSubscriptionHalted(payload: Record<string, unknown>) {
  const subId = getSubscriptionId(payload);
  if (!subId) return;
  const restaurantId = await getRestaurantIdBySubscription(subId);
  if (!restaurantId) return;
  await supabaseAdmin.from('subscriptions').update({ status: 'halted' }).eq('razorpay_subscription_id', subId);
  await supabaseAdmin.from('restaurants').update({ status: 'suspended' }).eq('id', restaurantId);
}

async function handleSubscriptionEnded(payload: Record<string, unknown>, eventType: string) {
  const subId = getSubscriptionId(payload);
  if (!subId) return;
  const restaurantId = await getRestaurantIdBySubscription(subId);
  if (!restaurantId) return;
  const isCancelled = eventType === 'subscription.cancelled';
  await supabaseAdmin.from('subscriptions').update({
    status: isCancelled ? 'cancelled' : 'completed',
    cancelled_at: new Date().toISOString(),
  }).eq('razorpay_subscription_id', subId);
  await supabaseAdmin.from('restaurants').update({ status: isCancelled ? 'cancelled' : 'active' }).eq('id', restaurantId);
}

async function handleSubscriptionPaused(payload: Record<string, unknown>) {
  const subId = getSubscriptionId(payload);
  if (!subId) return;
  const restaurantId = await getRestaurantIdBySubscription(subId);
  if (!restaurantId) return;
  await supabaseAdmin.from('subscriptions').update({ status: 'paused' }).eq('razorpay_subscription_id', subId);
  await supabaseAdmin.from('restaurants').update({ status: 'suspended' }).eq('id', restaurantId);
}

async function handleSubscriptionResumed(payload: Record<string, unknown>) {
  const subId = getSubscriptionId(payload);
  if (!subId) return;
  const restaurantId = await getRestaurantIdBySubscription(subId);
  if (!restaurantId) return;
  await supabaseAdmin.from('subscriptions').update({ status: 'active' }).eq('razorpay_subscription_id', subId);
  await supabaseAdmin.from('restaurants').update({ status: 'active', trial_ends_at: null }).eq('id', restaurantId);
}

async function handlePaymentCaptured(payload: Record<string, unknown>) {
  const paymentEntity = getPaymentEntity(payload);
  if (!paymentEntity) return;
  const razorpayPaymentId = paymentEntity['id'] as string | undefined;
  const subId = paymentEntity['subscription_id'] as string | undefined;
  if (!subId || !razorpayPaymentId) return;
  const restaurantId = await getRestaurantIdBySubscription(subId);
  if (!restaurantId) return;
  const { data: sub } = await supabaseAdmin.from('subscriptions').select('id').eq('razorpay_subscription_id', subId).maybeSingle();
  await supabaseAdmin.from('payments').upsert({
    restaurant_id: restaurantId,
    subscription_id: sub?.id ?? null,
    razorpay_payment_id: razorpayPaymentId,
    amount_paise: Number(paymentEntity['amount'] ?? 0),
    currency: (paymentEntity['currency'] as string) ?? 'INR',
    status: 'captured',
  }, { onConflict: 'razorpay_payment_id' });
}

async function handlePaymentFailed(payload: Record<string, unknown>) {
  const paymentEntity = getPaymentEntity(payload);
  if (!paymentEntity) return;
  const razorpayPaymentId = paymentEntity['id'] as string | undefined;
  const subId = paymentEntity['subscription_id'] as string | undefined;
  if (!subId || !razorpayPaymentId) return;
  const restaurantId = await getRestaurantIdBySubscription(subId);
  if (!restaurantId) return;
  const { data: sub } = await supabaseAdmin.from('subscriptions').select('id').eq('razorpay_subscription_id', subId).maybeSingle();
  await supabaseAdmin.from('payments').upsert({
    restaurant_id: restaurantId,
    subscription_id: sub?.id ?? null,
    razorpay_payment_id: razorpayPaymentId,
    amount_paise: Number(paymentEntity['amount'] ?? 0),
    currency: (paymentEntity['currency'] as string) ?? 'INR',
    status: 'failed',
    failure_reason: (paymentEntity['error_description'] as string) ?? 'Payment failed',
  }, { onConflict: 'razorpay_payment_id' });
}

// ─── Main POST handler ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) return new NextResponse(null, { status: 500 });

  const receivedSignature = req.headers.get('x-razorpay-signature');
  if (!receivedSignature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  // Read raw body for HMAC verification
  const rawBody = await req.text();
  const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');

  if (expected !== receivedSignature) {
    console.warn('[Webhook] Invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventId = req.headers.get('x-razorpay-event-id');
  const eventType = payload['event'] as string | undefined;
  if (!eventId || !eventType) return NextResponse.json({ error: 'Missing event metadata' }, { status: 400 });

  // Idempotency
  const { error: insertError } = await supabaseAdmin.from('webhook_events')
    .insert({ razorpay_event_id: eventId, event_type: eventType, payload });
  if (insertError?.code === '23505') {
    return NextResponse.json({ status: 'already_processed' });
  }

  // Dispatch
  try {
    switch (eventType) {
      case 'subscription.authenticated': await handleSubscriptionAuthenticated(payload); break;
      case 'subscription.charged':       await handleSubscriptionCharged(payload); break;
      case 'subscription.halted':        await handleSubscriptionHalted(payload); break;
      case 'subscription.cancelled':
      case 'subscription.completed':     await handleSubscriptionEnded(payload, eventType); break;
      case 'subscription.paused':        await handleSubscriptionPaused(payload); break;
      case 'subscription.resumed':       await handleSubscriptionResumed(payload); break;
      case 'payment.captured':           await handlePaymentCaptured(payload); break;
      case 'payment.failed':             await handlePaymentFailed(payload); break;
      default: console.log('[Webhook] Unhandled event:', eventType);
    }
  } catch (err) {
    console.error('[Webhook] Handler error:', err);
    // Still return 200 so Razorpay doesn't retry infinitely
  }

  return NextResponse.json({ status: 'ok' });
}
