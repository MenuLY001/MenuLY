import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { requireAdminAuth } from '../../middleware/auth';
import { supabaseAdmin } from '../../lib/supabase';

const router = Router();
router.use(requireAdminAuth);

// ─── Razorpay client (lazy init — only if keys are present) ──────────────────
function getRazorpayClient(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error('RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not set.');
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

// ─── GET /api/admin/billing ───────────────────────────────────────────────────
/**
 * Returns the restaurant's billing info:
 * current subscription, last 20 payments, plan details, and restaurant status.
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { restaurantId } = req.adminContext!;

  // Fetch restaurant status + trial_ends_at
  const { data: restaurant, error: restError } = await supabaseAdmin
    .from('restaurants')
    .select('status, trial_ends_at')
    .eq('id', restaurantId)
    .single();

  if (restError || !restaurant) {
    res.status(404).json({ error: 'Restaurant not found' });
    return;
  }

  // Fetch subscription (most recent)
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Fetch plan
  let plan = null;
  if (subscription?.plan_id) {
    const { data: planData } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('id', subscription.plan_id)
      .maybeSingle();
    plan = planData;
  }

  // Fetch recent payments
  const { data: payments } = await supabaseAdmin
    .from('payments')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })
    .limit(20);

  res.json({
    status: restaurant.status,
    trial_ends_at: restaurant.trial_ends_at,
    subscription: subscription ?? null,
    plan,
    payments: payments ?? [],
  });
});

// ─── POST /api/admin/billing/create-subscription ─────────────────────────────
/**
 * Creates a Razorpay subscription for the authenticated restaurant.
 * Returns { subscription_id, key_id } for the frontend to open Razorpay Checkout.
 *
 * Security: restaurant_id comes from the verified JWT — never from the client.
 */
router.post('/create-subscription', async (req: Request, res: Response): Promise<void> => {
  const { restaurantId } = req.adminContext!;

  // Check that the restaurant exists and is in a state that allows subscription
  const { data: restaurant, error: restError } = await supabaseAdmin
    .from('restaurants')
    .select('id, name, slug, status')
    .eq('id', restaurantId)
    .single();

  if (restError || !restaurant) {
    res.status(404).json({ error: 'Restaurant not found' });
    return;
  }

  if (restaurant.status === 'cancelled') {
    res.status(400).json({ error: 'This restaurant account has been cancelled and cannot create a new subscription.' });
    return;
  }

  // Check for an already-active subscription
  const { data: existingSub } = await supabaseAdmin
    .from('subscriptions')
    .select('id, status, razorpay_subscription_id')
    .eq('restaurant_id', restaurantId)
    .in('status', ['created', 'authenticated', 'active', 'pending'])
    .maybeSingle();

  if (existingSub) {
    // Return the existing subscription so the frontend can open Checkout again
    res.json({
      subscription_id: existingSub.razorpay_subscription_id,
      key_id: process.env.RAZORPAY_KEY_ID,
      existing: true,
    });
    return;
  }

  // Get the active plan
  const { data: plan, error: planError } = await supabaseAdmin
    .from('plans')
    .select('id, razorpay_plan_id, name, price_paise')
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (planError || !plan) {
    res.status(500).json({ error: 'No active plan found.' });
    return;
  }

  if (!plan.razorpay_plan_id) {
    res.status(503).json({
      error: 'Payment is not configured yet. Please contact support.',
      code: 'RAZORPAY_PLAN_NOT_CONFIGURED',
    });
    return;
  }

  // Create Razorpay subscription
  let razorpaySubscription: { id: string };
  try {
    const rzp = getRazorpayClient();
    razorpaySubscription = await rzp.subscriptions.create({
      plan_id: plan.razorpay_plan_id,
      total_count: 120,    // 10 years worth of monthly payments
      quantity: 1,
      customer_notify: 1,  // Razorpay sends pre-debit notifications
      notes: {
        restaurant_id: restaurantId,
        restaurant_name: restaurant.name,
        restaurant_slug: restaurant.slug,
      },
    } as Parameters<typeof rzp.subscriptions.create>[0]);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : JSON.stringify(err);
    console.error('[Billing/create-subscription] Razorpay error:', msg);
    res.status(502).json({ error: `Failed to create Razorpay subscription: ${msg}` });
    return;
  }

  // Store subscription in our DB
  const { error: subError } = await supabaseAdmin
    .from('subscriptions')
    .insert({
      restaurant_id: restaurantId,
      plan_id: plan.id,
      status: 'created',
      razorpay_subscription_id: razorpaySubscription.id,
    });

  if (subError) {
    console.error('[Billing/create-subscription] Failed to store subscription:', subError);
    // Non-fatal: the Razorpay subscription exists; we can reconcile via webhook
  }

  res.json({
    subscription_id: razorpaySubscription.id,
    key_id: process.env.RAZORPAY_KEY_ID,
    existing: false,
  });
});

// ─── POST /api/admin/billing/verify-payment ───────────────────────────────────
/**
 * Verifies the Razorpay signature from the checkout success callback.
 * If valid, marks the restaurant as active (optimistic activation).
 * The webhook handler will also fire — handlers are idempotent.
 *
 * Razorpay signature for subscriptions:
 *   HMAC-SHA256(razorpay_payment_id + "|" + razorpay_subscription_id, key_secret)
 */
router.post('/verify-payment', async (req: Request, res: Response): Promise<void> => {
  const { restaurantId } = req.adminContext!;

  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body as {
    razorpay_payment_id?: string;
    razorpay_subscription_id?: string;
    razorpay_signature?: string;
  };

  if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
    res.status(400).json({ error: 'Missing Razorpay payment response fields.' });
    return;
  }

  // Verify signature
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    res.status(500).json({ error: 'Payment verification is not configured.' });
    return;
  }

  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    console.warn('[Billing/verify-payment] Signature mismatch for restaurant:', restaurantId);
    res.status(400).json({ error: 'Payment verification failed. Invalid signature.' });
    return;
  }

  // Update subscription status
  await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'authenticated' })
    .eq('razorpay_subscription_id', razorpay_subscription_id)
    .eq('restaurant_id', restaurantId);

  // Optimistically activate the restaurant
  // (the webhook will also handle this — idempotent)
  await supabaseAdmin
    .from('restaurants')
    .update({ status: 'active', trial_ends_at: null })
    .eq('id', restaurantId);

  // Record the payment
  await supabaseAdmin.from('payments').insert({
    restaurant_id: restaurantId,
    razorpay_payment_id,
    razorpay_subscription_id,
    amount_paise: 0,     // actual amount comes via webhook
    currency: 'INR',
    status: 'captured',  // assume captured at checkout; webhook will correct if needed
  }).select().maybeSingle();

  res.json({ success: true, message: 'Payment verified. Your subscription is now active.' });
});

// ─── POST /api/admin/billing/cancel ──────────────────────────────────────────
/**
 * Cancels the subscription at period end (restaurant stays active until next billing date).
 */
router.post('/cancel', async (req: Request, res: Response): Promise<void> => {
  const { restaurantId } = req.adminContext!;

  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('id, razorpay_subscription_id, status')
    .eq('restaurant_id', restaurantId)
    .in('status', ['authenticated', 'active'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sub || !sub.razorpay_subscription_id) {
    res.status(404).json({ error: 'No active subscription found.' });
    return;
  }

  try {
    const rzp = getRazorpayClient();
    await rzp.subscriptions.cancel(sub.razorpay_subscription_id, true); // cancel_at_cycle_end = true
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Billing/cancel] Razorpay error:', msg);
    res.status(502).json({ error: `Failed to cancel subscription: ${msg}` });
    return;
  }

  // Mark in DB — webhook will confirm
  await supabaseAdmin
    .from('subscriptions')
    .update({ cancel_at_period_end: true })
    .eq('id', sub.id);

  res.json({ success: true, message: 'Subscription will be cancelled at the end of the current billing period.' });
});

export default router;
