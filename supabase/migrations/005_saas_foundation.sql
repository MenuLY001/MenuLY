-- ============================================================
-- Menuly Platform — SaaS Foundation
-- Migration 005
--
-- ⚠  READ BEFORE RUNNING:
--
--   1. Run the pre-flight SELECT below (read-only) first.
--      If it returns rows, fix those cross-tenant references
--      before continuing.
--
--   2. This migration never drops user data.  The composite FK
--      (step 6) will fail if step 1 found violations.
--
--   3. After running, create a plan in Razorpay dashboard
--      (test mode) and run:
--        UPDATE plans
--        SET razorpay_plan_id = 'plan_XXXXXXXXXX'
--        WHERE name = 'Menuly Pro';
--
--   4. Enable pg_cron extension, then uncomment the
--      cron.schedule call at the bottom.
-- ============================================================

-- ─── PRE-FLIGHT: cross-tenant integrity check ─────────────────────────────────
-- Run this SELECT before anything else (zero risk — read-only).
-- Expected: 0 rows. If any rows appear, fix them first.
--
-- SELECT mi.id, mi.name, mi.restaurant_id AS item_restaurant,
--        c.restaurant_id AS cat_restaurant
-- FROM   menu_items mi
-- JOIN   categories c ON c.id = mi.category_id
-- WHERE  mi.restaurant_id <> c.restaurant_id;

-- ─── 1. Restaurant status enum ────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'restaurant_status') THEN
    CREATE TYPE restaurant_status AS ENUM (
      'trialing',
      'active',
      'past_due',
      'suspended',
      'cancelled'
    );
  END IF;
END
$$;

-- ─── 2. Add billing columns to restaurants ────────────────────────────────────
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS status        restaurant_status NOT NULL DEFAULT 'trialing',
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW();

COMMENT ON COLUMN restaurants.status IS
  'trialing | active | past_due | suspended | cancelled';
COMMENT ON COLUMN restaurants.trial_ends_at IS
  'NULL when not in trial. Timestamp when the trial window closes.';
COMMENT ON COLUMN restaurants.updated_at IS
  'Auto-updated on every row mutation via trigger.';

-- ─── 3. updated_at auto-trigger (reusable) ────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS restaurants_updated_at ON restaurants;
CREATE TRIGGER restaurants_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── 4. Reserved-slug blocklist ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION check_reserved_slug()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  _reserved TEXT[] := ARRAY[
    'admin', 'superadmin', 'super-admin', 'api', 'login', 'logout',
    'register', 'signup', 'app', 'www', 'dashboard', 'billing',
    'settings', 'webhook', 'webhooks', 'health', 'auth', 'me',
    'account', 'subscription', 'payment', 'checkout', 'status',
    'support', 'help', 'about', 'contact', 'pricing', 'terms',
    'privacy', 'null', 'undefined', 'test', 'demo', 'menuly',
    'platform', 'static', 'assets', 'public'
  ];
BEGIN
  IF NEW.slug = ANY(_reserved) THEN
    RAISE EXCEPTION 'Slug "%" is reserved and cannot be used.', NEW.slug
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS restaurants_reserved_slug ON restaurants;
CREATE TRIGGER restaurants_reserved_slug
  BEFORE INSERT OR UPDATE OF slug ON restaurants
  FOR EACH ROW EXECUTE FUNCTION check_reserved_slug();

-- ─── 5. Composite unique on categories ────────────────────────────────────────
-- id is already PK (globally unique), so (id, restaurant_id) is trivially
-- unique. This constraint exists solely to allow the composite FK below.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'categories_id_restaurant_id_key'
  ) THEN
    ALTER TABLE categories
      ADD CONSTRAINT categories_id_restaurant_id_key
      UNIQUE (id, restaurant_id);
  END IF;
END
$$;

-- ─── 6. Composite FK on menu_items ────────────────────────────────────────────
-- Enforces at the DB level: item.restaurant_id must equal category.restaurant_id.
ALTER TABLE menu_items DROP CONSTRAINT IF EXISTS menu_items_category_id_fkey;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'menu_items_category_restaurant_fkey'
  ) THEN
    ALTER TABLE menu_items
      ADD CONSTRAINT menu_items_category_restaurant_fkey
      FOREIGN KEY (category_id, restaurant_id)
      REFERENCES categories(id, restaurant_id)
      ON DELETE CASCADE;
  END IF;
END
$$;

-- ─── 7. Performance indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_categories_restaurant_id
  ON categories(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_cat_sort
  ON menu_items(restaurant_id, category_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_restaurants_status
  ON restaurants(status);

CREATE INDEX IF NOT EXISTS idx_restaurants_trial_ends_at
  ON restaurants(trial_ends_at)
  WHERE trial_ends_at IS NOT NULL;

-- ─── 8. Plans table ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plans (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT    NOT NULL,
  description      TEXT,
  -- Smallest currency unit (paise): ₹299 = 29900
  price_paise      INTEGER NOT NULL CHECK (price_paise > 0),
  currency         TEXT    NOT NULL DEFAULT 'INR',
  interval         TEXT    NOT NULL DEFAULT 'monthly',
  -- Fill in after creating the plan in the Razorpay dashboard.
  razorpay_plan_id TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN plans.price_paise IS
  'Amount in paise. ₹299 = 29900.';
COMMENT ON COLUMN plans.razorpay_plan_id IS
  'Set after creating the plan in Razorpay dashboard (test or live).';

INSERT INTO plans (name, description, price_paise, currency, interval, razorpay_plan_id)
VALUES (
  'Menuly Pro',
  'Full access to Menuly QR menu platform — ₹299/month with autopay',
  29900,
  'INR',
  'monthly',
  NULL
  -- TODO: After running, fill in:
  --   UPDATE plans SET razorpay_plan_id = 'plan_XXX' WHERE name = 'Menuly Pro';
) ON CONFLICT DO NOTHING;

-- ─── 9. Subscriptions table ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id            UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  plan_id                  UUID NOT NULL REFERENCES plans(id),
  -- Razorpay states: created|authenticated|active|pending|halted|cancelled|completed|paused|expired
  status                   TEXT NOT NULL DEFAULT 'created',
  razorpay_subscription_id TEXT UNIQUE,
  current_period_start     TIMESTAMPTZ,
  current_period_end       TIMESTAMPTZ,
  cancel_at_period_end     BOOLEAN NOT NULL DEFAULT FALSE,
  cancelled_at             TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS subscriptions_updated_at ON subscriptions;
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_subscriptions_restaurant_id
  ON subscriptions(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_razorpay_id
  ON subscriptions(razorpay_subscription_id)
  WHERE razorpay_subscription_id IS NOT NULL;

-- ─── 10. Payments table ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id       UUID    NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  subscription_id     UUID    REFERENCES subscriptions(id),
  razorpay_payment_id TEXT    UNIQUE,
  razorpay_order_id   TEXT,
  amount_paise        INTEGER NOT NULL CHECK (amount_paise >= 0),
  currency            TEXT    NOT NULL DEFAULT 'INR',
  -- 'captured' | 'failed' | 'refunded'
  status              TEXT    NOT NULL,
  failure_reason      TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_restaurant_id
  ON payments(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_payments_subscription_id
  ON payments(subscription_id);

-- ─── 11. Webhook events table (idempotency) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS webhook_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Unique constraint: duplicate webhook delivery hits a constraint error
  -- which we catch and return HTTP 200 (already processed).
  razorpay_event_id TEXT NOT NULL UNIQUE,
  event_type        TEXT NOT NULL,
  payload           JSONB,
  processed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_razorpay_id
  ON webhook_events(razorpay_event_id);

-- ─── 12. Super admins table ───────────────────────────────────────────────────
-- API checks BOTH this table AND auth.users.app_metadata.role = 'super_admin'
-- (the latter is set via Supabase Admin API, never editable by users).
CREATE TABLE IF NOT EXISTS super_admins (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 13. Audit log (append-only) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID,              -- NULL = system (cron)
  actor_type  TEXT NOT NULL DEFAULT 'super_admin',
  action      TEXT NOT NULL,     -- e.g. 'restaurant.suspend'
  target_id   UUID,
  target_type TEXT,              -- 'restaurant' | 'subscription' | 'payment'
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_actor_id   ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_target_id  ON audit_log(target_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

-- ─── 14. RLS on new tables ────────────────────────────────────────────────────

ALTER TABLE plans          ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admins   ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log      ENABLE ROW LEVEL SECURITY;

-- Plans: public read (registration page needs to show the price)
DROP POLICY IF EXISTS "Public can read active plans" ON plans;
CREATE POLICY "Public can read active plans"
  ON plans FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);
-- No INSERT/UPDATE/DELETE for clients — service-role only.

-- Subscriptions: admins read own
DROP POLICY IF EXISTS "Admin can read own subscription" ON subscriptions;
CREATE POLICY "Admin can read own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_admins WHERE user_id = auth.uid()
    )
  );
-- No write policies — service-role only.

-- Payments: admins read own
DROP POLICY IF EXISTS "Admin can read own payments" ON payments;
CREATE POLICY "Admin can read own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_admins WHERE user_id = auth.uid()
    )
  );
-- No write policies — service-role only.

-- webhook_events, super_admins, audit_log: service-role only.
-- RLS enabled with zero permissive policies = deny all non-service-role access.

-- ─── 15. Set existing restaurants to trial period ─────────────────────────────
-- All existing live restaurants get a grace window until 2026-10-05 IST.
-- After that date the daily cron will move unpaid ones to 'suspended'.
UPDATE restaurants
SET
  status        = 'trialing',
  trial_ends_at = '2026-10-05 23:59:59+05:30'::TIMESTAMPTZ;

-- ─── 16. Billing status sweep function ───────────────────────────────────────
-- GRACE_PERIOD_DAYS = 7 (configurable here).
CREATE OR REPLACE FUNCTION run_billing_status_sweep()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  _grace_days CONSTANT INTEGER := 7;
BEGIN
  -- a) Expired trials → suspended
  UPDATE restaurants
  SET status = 'suspended'
  WHERE status = 'trialing'
    AND trial_ends_at IS NOT NULL
    AND trial_ends_at < NOW();

  -- b) past_due restaurants with no successful payment within grace period → suspended
  UPDATE restaurants r
  SET status = 'suspended'
  WHERE r.status = 'past_due'
    AND NOT EXISTS (
      SELECT 1 FROM payments p
      WHERE  p.restaurant_id = r.id
        AND  p.status = 'captured'
        AND  p.created_at > NOW() - (_grace_days || ' days')::INTERVAL
    );

  -- c) Audit trail
  INSERT INTO audit_log (actor_type, action, metadata)
  VALUES ('system', 'billing.status_sweep', jsonb_build_object('ran_at', NOW()));
END;
$$;

-- Schedule daily at 02:00 IST (20:30 UTC).
-- Uncomment AFTER enabling pg_cron:
--   Dashboard → Database → Extensions → pg_cron
--
-- SELECT cron.schedule(
--   'billing-status-sweep',
--   '30 20 * * *',
--   'SELECT run_billing_status_sweep()'
-- );
