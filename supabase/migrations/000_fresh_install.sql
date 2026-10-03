-- ============================================================
-- Menuly Platform — Full Schema (Fresh Install)
-- Version: 2.0 (SaaS)
--
-- Run this ONCE on a BLANK Supabase project.
-- It combines migrations 001–005 into a single clean script.
--
-- Steps before running:
--   1. Enable the "pgcrypto" extension (already done by Supabase by default).
--   2. Create a public Storage bucket called "menu-images" manually in
--      Supabase Dashboard → Storage → New bucket (public ON).
--   3. After running, create a Razorpay plan and run:
--        UPDATE plans SET razorpay_plan_id = 'plan_XXXXXXXXXX'
--        WHERE name = 'Menuly Pro';
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Enums ───────────────────────────────────────────────────────────────────
CREATE TYPE restaurant_status AS ENUM (
  'trialing',
  'active',
  'past_due',
  'suspended',
  'cancelled'
);

-- ─── Core Tables ─────────────────────────────────────────────────────────────

CREATE TABLE restaurants (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT        NOT NULL UNIQUE,
  name             TEXT        NOT NULL,
  logo_url         TEXT,
  theme_color      TEXT        NOT NULL DEFAULT '#e67e22',
  menu_template    TEXT        NOT NULL DEFAULT 'classic', -- 'classic' | 'menuly-dark'
  ordering_enabled BOOLEAN     NOT NULL DEFAULT FALSE,
  -- ─── SaaS billing ───────────────────────────────────────────────────────
  status           restaurant_status NOT NULL DEFAULT 'trialing',
  trial_ends_at    TIMESTAMPTZ,  -- NULL when not in trial
  -- ─── Timestamps ─────────────────────────────────────────────────────────
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN restaurants.slug          IS 'URL-safe unique identifier. e.g. "spice-garden"';
COMMENT ON COLUMN restaurants.menu_template IS '"classic" | "menuly-dark"';
COMMENT ON COLUMN restaurants.status        IS 'trialing → active → past_due → suspended | cancelled';
COMMENT ON COLUMN restaurants.trial_ends_at IS 'NULL when not in a free trial period';

CREATE TABLE restaurant_admins (
  user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id)  ON DELETE CASCADE
);

CREATE TABLE categories (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID    NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name          TEXT    NOT NULL,
  sort_order    INTEGER NOT NULL DEFAULT 0
);

-- Composite unique required for the cross-tenant FK on menu_items below
ALTER TABLE categories
  ADD CONSTRAINT categories_id_restaurant_id_key UNIQUE (id, restaurant_id);

CREATE TABLE menu_items (
  id            UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID           NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  -- Composite FK: enforces item.restaurant_id == category.restaurant_id at DB level
  category_id   UUID           NOT NULL,
  name          TEXT           NOT NULL,
  description   TEXT,
  price         NUMERIC(10,2)  NOT NULL CHECK (price >= 0),
  image_url     TEXT,
  is_available  BOOLEAN        NOT NULL DEFAULT TRUE,
  is_veg        BOOLEAN        NOT NULL DEFAULT FALSE,
  is_special    BOOLEAN        NOT NULL DEFAULT FALSE,
  sort_order    INTEGER        NOT NULL DEFAULT 0,
  CONSTRAINT menu_items_category_restaurant_fkey
    FOREIGN KEY (category_id, restaurant_id)
    REFERENCES categories(id, restaurant_id)
    ON DELETE CASCADE
);

-- ─── Billing Tables ───────────────────────────────────────────────────────────

CREATE TABLE plans (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT    NOT NULL,
  description      TEXT,
  price_paise      INTEGER NOT NULL CHECK (price_paise > 0), -- ₹299 = 29900 paise
  currency         TEXT    NOT NULL DEFAULT 'INR',
  interval         TEXT    NOT NULL DEFAULT 'monthly',
  razorpay_plan_id TEXT,         -- fill in after creating plan in Razorpay dashboard
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the default plan
INSERT INTO plans (name, description, price_paise, currency, interval)
VALUES (
  'Menuly Pro',
  'Full access to Menuly QR menu platform — ₹299/month with autopay',
  29900, 'INR', 'monthly'
);

CREATE TABLE subscriptions (
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

CREATE TABLE payments (
  id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id       UUID    NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  subscription_id     UUID    REFERENCES subscriptions(id),
  razorpay_payment_id TEXT    UNIQUE,
  razorpay_order_id   TEXT,
  amount_paise        INTEGER NOT NULL CHECK (amount_paise >= 0),
  currency            TEXT    NOT NULL DEFAULT 'INR',
  status              TEXT    NOT NULL, -- 'captured' | 'failed' | 'refunded'
  failure_reason      TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Idempotency table: duplicate webhook deliveries hit a UNIQUE conflict → skip
CREATE TABLE webhook_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razorpay_event_id TEXT NOT NULL UNIQUE,
  event_type        TEXT NOT NULL,
  payload           JSONB,
  processed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Platform Tables ──────────────────────────────────────────────────────────

-- Super admins: API checks BOTH this table AND app_metadata.role = 'super_admin'
CREATE TABLE super_admins (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Append-only audit log
CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID,              -- NULL = system (e.g. cron job)
  actor_type  TEXT NOT NULL DEFAULT 'super_admin', -- 'super_admin' | 'system'
  action      TEXT NOT NULL,     -- e.g. 'restaurant.suspend'
  target_id   UUID,
  target_type TEXT,              -- 'restaurant' | 'subscription' | 'payment'
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX idx_restaurant_admins_restaurant ON restaurant_admins(restaurant_id);
CREATE INDEX idx_categories_restaurant        ON categories(restaurant_id, sort_order);
CREATE INDEX idx_menu_items_restaurant        ON menu_items(restaurant_id, sort_order);
CREATE INDEX idx_menu_items_category          ON menu_items(category_id);
CREATE INDEX idx_menu_items_restaurant_cat    ON menu_items(restaurant_id, category_id, sort_order);
CREATE INDEX idx_restaurants_status           ON restaurants(status);
CREATE INDEX idx_restaurants_trial_ends_at    ON restaurants(trial_ends_at) WHERE trial_ends_at IS NOT NULL;
CREATE INDEX idx_subscriptions_restaurant_id  ON subscriptions(restaurant_id);
CREATE INDEX idx_subscriptions_razorpay_id    ON subscriptions(razorpay_subscription_id) WHERE razorpay_subscription_id IS NOT NULL;
CREATE INDEX idx_payments_restaurant_id       ON payments(restaurant_id);
CREATE INDEX idx_payments_subscription_id     ON payments(subscription_id);
CREATE INDEX idx_webhook_events_razorpay_id   ON webhook_events(razorpay_event_id);
CREATE INDEX idx_audit_log_actor_id           ON audit_log(actor_id);
CREATE INDEX idx_audit_log_target_id          ON audit_log(target_id);
CREATE INDEX idx_audit_log_created_at         ON audit_log(created_at DESC);

-- ─── Triggers ────────────────────────────────────────────────────────────────

-- 1. Auto-update updated_at on restaurants + subscriptions
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER restaurants_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 2. Reserved-slug blocklist
CREATE OR REPLACE FUNCTION check_reserved_slug()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  _reserved TEXT[] := ARRAY[
    'admin','superadmin','super-admin','api','login','logout',
    'register','signup','app','www','dashboard','billing',
    'settings','webhook','webhooks','health','auth','me',
    'account','subscription','payment','checkout','status',
    'support','help','about','contact','pricing','terms',
    'privacy','null','undefined','test','demo','menuly',
    'platform','static','assets','public'
  ];
BEGIN
  IF NEW.slug = ANY(_reserved) THEN
    RAISE EXCEPTION 'Slug "%" is reserved.', NEW.slug
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER restaurants_reserved_slug
  BEFORE INSERT OR UPDATE OF slug ON restaurants
  FOR EACH ROW EXECUTE FUNCTION check_reserved_slug();

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE restaurants      ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans            ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admins     ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log        ENABLE ROW LEVEL SECURITY;

-- ── restaurants ──
-- Public: anyone can read (needed for public menu page)
CREATE POLICY "Public can read restaurants"
  ON restaurants FOR SELECT TO anon, authenticated USING (TRUE);

-- Admins: update own restaurant only
CREATE POLICY "Admin can update own restaurant"
  ON restaurants FOR UPDATE TO authenticated
  USING (id IN (SELECT restaurant_id FROM restaurant_admins WHERE user_id = auth.uid()));

-- ── restaurant_admins ──
CREATE POLICY "Admin can read own mapping"
  ON restaurant_admins FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ── categories ──
CREATE POLICY "Public can read categories"
  ON categories FOR SELECT TO anon, authenticated USING (TRUE);

CREATE POLICY "Admin can insert categories"
  ON categories FOR INSERT TO authenticated
  WITH CHECK (restaurant_id IN (SELECT restaurant_id FROM restaurant_admins WHERE user_id = auth.uid()));

CREATE POLICY "Admin can update own categories"
  ON categories FOR UPDATE TO authenticated
  USING (restaurant_id IN (SELECT restaurant_id FROM restaurant_admins WHERE user_id = auth.uid()));

CREATE POLICY "Admin can delete own categories"
  ON categories FOR DELETE TO authenticated
  USING (restaurant_id IN (SELECT restaurant_id FROM restaurant_admins WHERE user_id = auth.uid()));

-- ── menu_items ──
CREATE POLICY "Public can read menu items"
  ON menu_items FOR SELECT TO anon, authenticated USING (TRUE);

CREATE POLICY "Admin can insert menu items"
  ON menu_items FOR INSERT TO authenticated
  WITH CHECK (restaurant_id IN (SELECT restaurant_id FROM restaurant_admins WHERE user_id = auth.uid()));

CREATE POLICY "Admin can update own menu items"
  ON menu_items FOR UPDATE TO authenticated
  USING (restaurant_id IN (SELECT restaurant_id FROM restaurant_admins WHERE user_id = auth.uid()));

CREATE POLICY "Admin can delete own menu items"
  ON menu_items FOR DELETE TO authenticated
  USING (restaurant_id IN (SELECT restaurant_id FROM restaurant_admins WHERE user_id = auth.uid()));

-- ── plans ──
-- Public read so the registration page can show the price
CREATE POLICY "Public can read active plans"
  ON plans FOR SELECT TO anon, authenticated USING (is_active = TRUE);
-- No client writes — service-role only

-- ── subscriptions ──
-- Admins read their own restaurant's subscription only
CREATE POLICY "Admin can read own subscription"
  ON subscriptions FOR SELECT TO authenticated
  USING (restaurant_id IN (SELECT restaurant_id FROM restaurant_admins WHERE user_id = auth.uid()));
-- No client writes — service-role only

-- ── payments ──
CREATE POLICY "Admin can read own payments"
  ON payments FOR SELECT TO authenticated
  USING (restaurant_id IN (SELECT restaurant_id FROM restaurant_admins WHERE user_id = auth.uid()));
-- No client writes — service-role only

-- webhook_events, super_admins, audit_log:
-- RLS ON + zero permissive policies = service-role only (full deny for clients)

-- ─── Billing Status Sweep (pg_cron) ──────────────────────────────────────────
-- Runs daily. Moves expired trials → suspended, persistent past_due → suspended.
-- Enable pg_cron first: Dashboard → Database → Extensions → pg_cron
CREATE OR REPLACE FUNCTION run_billing_status_sweep()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  _grace_days CONSTANT INTEGER := 7;
BEGIN
  -- Expired trials → suspended
  UPDATE restaurants
  SET status = 'suspended'
  WHERE status = 'trialing'
    AND trial_ends_at IS NOT NULL
    AND trial_ends_at < NOW();

  -- past_due with no payment in grace window → suspended
  UPDATE restaurants r
  SET status = 'suspended'
  WHERE r.status = 'past_due'
    AND NOT EXISTS (
      SELECT 1 FROM payments p
      WHERE p.restaurant_id = r.id
        AND p.status = 'captured'
        AND p.created_at > NOW() - (_grace_days || ' days')::INTERVAL
    );

  INSERT INTO audit_log (actor_type, action, metadata)
  VALUES ('system', 'billing.status_sweep', jsonb_build_object('ran_at', NOW()));
END;
$$;

-- Uncomment after enabling pg_cron extension:
-- SELECT cron.schedule('billing-status-sweep', '30 20 * * *', 'SELECT run_billing_status_sweep()');
-- (30 20 * * * = 02:00 IST daily)

-- ─── Storage Bucket ───────────────────────────────────────────────────────────
-- Create manually in Supabase Dashboard → Storage → New bucket:
--   Name: menu-images
--   Public: ON
-- OR via Supabase CLI: supabase storage create-bucket menu-images --public
