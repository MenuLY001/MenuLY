import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { supabaseAdmin } from '../../lib/supabase';

/**
 * Razorpay Webhook Handler
 * POST /api/webhooks/razorpay
 *
 * IMPORTANT: This route is mounted with express.raw() (NOT express.json())
 * so we receive the raw body string for signature verification.
 *
 * Security model:
 *   1. Verify Razorpay-Signature header against RAZORPAY_WEBHOOK_SECRET.
 *   2. Check idempotency: insert razorpay_event_id into webhook_events.
 *      If the INSERT hits a UNIQUE conflict, this is a duplicate — return 200.
 *   3. Handle the event and return 200 quickly.
 *      Razorpay will retry on non-2xx responses.
 *
 * Status state machine:
 *   subscription.authenticated → restaurant: active
 *   subscription.charged       → record payment, update period
 *   subscription.pending       → restaurant: past_due
 *   subscription.halted        → restaurant: suspended
 *   subscription.cancelled     → restaurant: cancelled
 *   subscription.paused        → restaurant: suspended (treat as inactive)
 *   subscription.resumed       → restaurant: active
 *   payment.captured           → record payment
 *   payment.failed             → record failure
 */
const router = Router();

router.post('/', async (req: Request, res: Response): Promise<void> => {
  // ─── 1. Verify Razorpay signature ─────────────────────────────────────────
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[Webhook] RAZORPAY_WEBHOOK_SECRET is not set — rejecting request');
    res.status(500).end();
    return;
  }

  const receivedSignature = req.headers['x-razorpay-signature'] as string | undefined;
  if (!receivedSignature) {
    res.status(400).json({ error: 'Missing X-Razorpay-Signature header' });
    return;
  }

  // req.body is a Buffer when mounted with express.raw()
  const rawBody = req.body as Buffer;
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  if (expectedSignature !== receivedSignature) {
    console.warn('[Webhook] Invalid signature — possible forged request');
    res.status(400).json({ error: 'Invalid signature' });
    return;
  }

  // ─── 2. Parse payload ─────────────────────────────────────────────────────
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch {
    res.status(400).json({ error: 'Invalid JSON payload' });
    return;
  }

  const eventId = req.headers['x-razorpay-event-id'] as string | undefined;
  const eventType = payload['event'] as string | undefined;

  if (!eventId || !eventType) {
    res.status(400).json({ error: 'Missing event ID or event type' });
    return;
  }

  // ─── 3. Idempotency check ─────────────────────────────────────────────────
  const { error: insertError } = await supabaseAdmin
    .from('webhook_events')
    .insert({ razorpay_event_id: eventId, event_type: eventType, payload });

  if (insertError) {
    if (insertError.code === '23505') {
      // Duplicate event — already processed
      console.log(`[Webhook] Duplicate event ${eventId} (${eventType}) — skipping`);
      res.status(200).json({ status: 'already_processed' });
      return;
    }
    console.error('[Webhook] Failed to record event:', insertError);
    // Continue processing even if recording fails
  }

  console.log(`[Webhook] Processing event: ${eventType} (${eventId})`);

  // ─── 4. Handle events ─────────────────────────────────────────────────────
  try {
    await handleEvent(eventType, payload);
  } catch (err) {
    console.error(`[Webhook] Handler error for ${eventType}:`, err);
    // Return 200 anyway — we've recorded the event. Don't let Razorpay retry infinitely.
    // Fix the handler bug and replay from webhook_events table.
  }

  // Always return 200 quickly
  res.status(200).json({ status: 'ok' });
});

// ─── Event handler ────────────────────────────────────────────────────────────

async function handleEvent(eventType: string, payload: Record<string, unknown>): Promise<void> {
  switch (eventType) {
    case 'subscription.authenticated':
      await handleSubscriptionAuthenticated(payload);
      break;

    case 'subscription.charged':
      await handleSubscriptionCharged(payload);
      break;

    case 'subscription.pending':
      await handleSubscriptionPending(payload);
      break;

    case 'subscription.halted':
      await handleSubscriptionHalted(payload);
      break;

    case 'subscription.cancelled':
    case 'subscription.completed':
      await handleSubscriptionEnded(payload, eventType);
      break;

    case 'subscription.paused':
      await handleSubscriptionPaused(payload);
      break;

    case 'subscription.resumed':
      await handleSubscriptionResumed(payload);
      break;

    case 'payment.captured':
      await handlePaymentCaptured(payload);
      break;

    case 'payment.failed':
      await handlePaymentFailed(payload);
      break;

    default:
      console.log(`[Webhook] Unhandled event type: ${eventType}`);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSubscriptionId(payload: Record<string, unknown>): string | null {
  const inner = payload['payload'] as Record<string, unknown>;
  const subWrapper = inner?.['subscription'] as Record<string, unknown> | undefined;
  const entity = subWrapper?.['entity'] as Record<string, unknown> | undefined;
  return (entity?.['id'] as string) ?? null;
}

function getPaymentEntity(payload: Record<string, unknown>): Record<string, unknown> | null {
  const inner = payload['payload'] as Record<string, unknown>;
  const payWrapper = inner?.['payment'] as Record<string, unknown> | undefined;
  return (payWrapper?.['entity'] as Record<string, unknown>) ?? null;
}

async function getRestaurantIdBySubscription(razorpaySubId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('subscriptions')
    .select('restaurant_id')
    .eq('razorpay_subscription_id', razorpaySubId)
    .maybeSingle();
  return data?.restaurant_id ?? null;
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function handleSubscriptionAuthenticated(payload: Record<string, unknown>): Promise<void> {
  const subId = getSubscriptionId(payload);
  if (!subId) return;

  const restaurantId = await getRestaurantIdBySubscription(subId);
  if (!restaurantId) {
    console.warn(`[Webhook] subscription.authenticated: no restaurant for sub ${subId}`);
    return;
  }

  await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'authenticated' })
    .eq('razorpay_subscription_id', subId);

  // Activate the restaurant
  await supabaseAdmin
    .from('restaurants')
    .update({ status: 'active', trial_ends_at: null })
    .eq('id', restaurantId);

  console.log(`[Webhook] Restaurant ${restaurantId} activated (subscription authenticated)`);
}

async function handleSubscriptionCharged(payload: Record<string, unknown>): Promise<void> {
  const subId = getSubscriptionId(payload);
  const paymentEntity = getPaymentEntity(payload);
  if (!subId) return;

  const restaurantId = await getRestaurantIdBySubscription(subId);
  if (!restaurantId) return;

  const inner = payload['payload'] as Record<string, unknown>;
  const subWrapper = inner?.['subscription'] as Record<string, unknown> | undefined;
  const entity = subWrapper?.['entity'] as Record<string, unknown> | undefined;
  const currentStart = entity?.['current_start'] as number | undefined;
  const currentEnd   = entity?.['current_end']   as number | undefined;

  // Update subscription period
  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_start: currentStart ? new Date(currentStart * 1000).toISOString() : null,
      current_period_end:   currentEnd   ? new Date(currentEnd   * 1000).toISOString() : null,
    })
    .eq('razorpay_subscription_id', subId);

  // Ensure restaurant is active
  await supabaseAdmin
    .from('restaurants')
    .update({ status: 'active', trial_ends_at: null })
    .eq('id', restaurantId);

  // Record payment if we have a payment entity
  if (paymentEntity) {
    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('razorpay_subscription_id', subId)
      .maybeSingle();

    await supabaseAdmin.from('payments').upsert({
      restaurant_id:       restaurantId,
      subscription_id:     sub?.id ?? null,
      razorpay_payment_id: paymentEntity['id'] as string,
      amount_paise:        Number(paymentEntity['amount'] ?? 0),
      currency:            (paymentEntity['currency'] as string) ?? 'INR',
      status:              'captured',
    }, { onConflict: 'razorpay_payment_id' });
  }

  console.log(`[Webhook] Subscription charged for restaurant ${restaurantId}`);
}

async function handleSubscriptionPending(payload: Record<string, unknown>): Promise<void> {
  const subId = getSubscriptionId(payload);
  if (!subId) return;
  const restaurantId = await getRestaurantIdBySubscription(subId);
  if (!restaurantId) return;

  await supabaseAdmin.from('subscriptions').update({ status: 'pending' }).eq('razorpay_subscription_id', subId);
  await supabaseAdmin.from('restaurants').update({ status: 'past_due' }).eq('id', restaurantId);

  console.log(`[Webhook] Restaurant ${restaurantId} → past_due`);
}

async function handleSubscriptionHalted(payload: Record<string, unknown>): Promise<void> {
  const subId = getSubscriptionId(payload);
  if (!subId) return;
  const restaurantId = await getRestaurantIdBySubscription(subId);
  if (!restaurantId) return;

  await supabaseAdmin.from('subscriptions').update({ status: 'halted' }).eq('razorpay_subscription_id', subId);
  await supabaseAdmin.from('restaurants').update({ status: 'suspended' }).eq('id', restaurantId);

  console.log(`[Webhook] Restaurant ${restaurantId} → suspended (halted)`);
}

async function handleSubscriptionEnded(payload: Record<string, unknown>, eventType: string): Promise<void> {
  const subId = getSubscriptionId(payload);
  if (!subId) return;
  const restaurantId = await getRestaurantIdBySubscription(subId);
  if (!restaurantId) return;

  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('current_period_end')
    .eq('razorpay_subscription_id', subId)
    .single();

  const isExpired = sub?.current_period_end ? new Date(sub.current_period_end).getTime() <= Date.now() : true;
  const rzpStatus = eventType === 'subscription.cancelled' ? 'cancelled' : 'completed';

  await supabaseAdmin
    .from('subscriptions')
    .update({ status: rzpStatus, cancelled_at: new Date().toISOString() })
    .eq('razorpay_subscription_id', subId);

  if (eventType === 'subscription.cancelled') {
    if (isExpired) {
      await supabaseAdmin.from('restaurants').update({ status: 'cancelled' }).eq('id', restaurantId);
      console.log(`[Webhook] Restaurant ${restaurantId} → cancelled (expired)`);
    } else {
      console.log(`[Webhook] Restaurant ${restaurantId} kept active (paid until ${sub?.current_period_end})`);
    }
  } else {
    await supabaseAdmin.from('restaurants').update({ status: 'active' }).eq('id', restaurantId);
    console.log(`[Webhook] Restaurant ${restaurantId} → active (completed)`);
  }
}

async function handleSubscriptionPaused(payload: Record<string, unknown>): Promise<void> {
  const subId = getSubscriptionId(payload);
  if (!subId) return;
  const restaurantId = await getRestaurantIdBySubscription(subId);
  if (!restaurantId) return;

  await supabaseAdmin.from('subscriptions').update({ status: 'paused' }).eq('razorpay_subscription_id', subId);
  await supabaseAdmin.from('restaurants').update({ status: 'suspended' }).eq('id', restaurantId);

  console.log(`[Webhook] Restaurant ${restaurantId} → suspended (paused)`);
}

async function handleSubscriptionResumed(payload: Record<string, unknown>): Promise<void> {
  const subId = getSubscriptionId(payload);
  if (!subId) return;
  const restaurantId = await getRestaurantIdBySubscription(subId);
  if (!restaurantId) return;

  await supabaseAdmin.from('subscriptions').update({ status: 'active' }).eq('razorpay_subscription_id', subId);
  await supabaseAdmin.from('restaurants').update({ status: 'active', trial_ends_at: null }).eq('id', restaurantId);

  console.log(`[Webhook] Restaurant ${restaurantId} → active (resumed)`);
}

async function handlePaymentCaptured(payload: Record<string, unknown>): Promise<void> {
  const paymentEntity = getPaymentEntity(payload);
  if (!paymentEntity) return;

  const razorpayPaymentId = paymentEntity['id'] as string | undefined;
  const subId = paymentEntity['subscription_id'] as string | undefined;

  // For the very first subscription auth payment, subscription_id may be null.
  // In that case we still record the payment if we can find the subscription.
  let restaurantId: string | null = null;
  let ourSubId: string | null = null;

  if (subId) {
    restaurantId = await getRestaurantIdBySubscription(subId);
    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('razorpay_subscription_id', subId)
      .maybeSingle();
    ourSubId = sub?.id ?? null;
  }

  if (!restaurantId || !razorpayPaymentId) {
    console.log('[Webhook] payment.captured: skipping — no restaurant link or payment ID', { subId, razorpayPaymentId });
    return;
  }

  await supabaseAdmin.from('payments').upsert({
    restaurant_id:       restaurantId,
    subscription_id:     ourSubId,
    razorpay_payment_id: razorpayPaymentId,
    amount_paise:        Number(paymentEntity['amount'] ?? 0),
    currency:            (paymentEntity['currency'] as string) ?? 'INR',
    status:              'captured',
  }, { onConflict: 'razorpay_payment_id' });

  console.log(`[Webhook] Payment ${razorpayPaymentId} captured for restaurant ${restaurantId}`);
}

async function handlePaymentFailed(payload: Record<string, unknown>): Promise<void> {
  const paymentEntity = getPaymentEntity(payload);
  if (!paymentEntity) return;

  const subId = paymentEntity['subscription_id'] as string | undefined;
  if (!subId) return;

  const restaurantId = await getRestaurantIdBySubscription(subId);
  if (!restaurantId) return;

  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('id')
    .eq('razorpay_subscription_id', subId)
    .maybeSingle();

  const errorDesc = (paymentEntity['error_description'] as string) ?? 'Payment failed';

  await supabaseAdmin.from('payments').upsert({
    restaurant_id:       restaurantId,
    subscription_id:     sub?.id ?? null,
    razorpay_payment_id: paymentEntity['id'] as string,
    amount_paise:        Number(paymentEntity['amount'] ?? 0),
    currency:            (paymentEntity['currency'] as string) ?? 'INR',
    status:              'failed',
    failure_reason:      errorDesc,
  }, { onConflict: 'razorpay_payment_id' });

  console.log(`[Webhook] Payment failed for restaurant ${restaurantId}: ${errorDesc}`);
}

export default router;
