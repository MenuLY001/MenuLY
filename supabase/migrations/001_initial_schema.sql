-- ============================================================
-- QR Menu Platform — Initial Schema
-- Run against your Supabase project in the SQL editor or via
-- the Supabase CLI: supabase db push
-- ============================================================

-- ─── Enable UUID extension ─────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Tables ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS restaurants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  logo_url      TEXT,
  theme_color   TEXT NOT NULL DEFAULT '#e67e22',
  ordering_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN restaurants.slug IS 'URL-safe unique identifier — random, non-sequential. E.g. "spice-route-8f3a"';
COMMENT ON COLUMN restaurants.ordering_enabled IS 'Flip to TRUE to activate BackendOrderStrategy and enable real ordering';

CREATE TABLE IF NOT EXISTS restaurant_admins (
  user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_restaurant_admins_restaurant ON restaurant_admins(restaurant_id);

CREATE TABLE IF NOT EXISTS categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  sort_order    INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_categories_restaurant ON categories(restaurant_id, sort_order);

CREATE TABLE IF NOT EXISTS menu_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id   UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  price         NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  image_url     TEXT,
  is_available  BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order    INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- restaurants: public read (anyone can read restaurant metadata for public menu)
CREATE POLICY "Public can read restaurants"
  ON restaurants FOR SELECT
  TO anon, authenticated
  USING (TRUE);

-- restaurants: admins can update their own restaurant only
CREATE POLICY "Admin can update own restaurant"
  ON restaurants FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT restaurant_id FROM restaurant_admins
      WHERE user_id = auth.uid()
    )
  );

-- restaurant_admins: admins can read their own mapping
CREATE POLICY "Admin can read own mapping"
  ON restaurant_admins FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- categories: public read (filtered by restaurant_id in the query)
CREATE POLICY "Public can read categories"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (TRUE);

-- categories: admin write — only for their own restaurant
CREATE POLICY "Admin can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can update own categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can delete own categories"
  ON categories FOR DELETE
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_admins
      WHERE user_id = auth.uid()
    )
  );

-- menu_items: public read (filtered by restaurant_id in the query)
CREATE POLICY "Public can read menu items"
  ON menu_items FOR SELECT
  TO anon, authenticated
  USING (TRUE);

-- menu_items: admin write — only for their own restaurant
CREATE POLICY "Admin can insert menu items"
  ON menu_items FOR INSERT
  TO authenticated
  WITH CHECK (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can update own menu items"
  ON menu_items FOR UPDATE
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can delete own menu items"
  ON menu_items FOR DELETE
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_admins
      WHERE user_id = auth.uid()
    )
  );

-- ─── Storage Bucket ───────────────────────────────────────────────────────────
-- Create a public bucket called "menu-images" in Supabase Storage dashboard,
-- or run via Supabase CLI:
--
-- supabase storage create-bucket menu-images --public
--
-- The bucket stores images namespaced under: {restaurant_id}/{timestamp}.{ext}
-- Public read is enabled; write is via service-role key (API only).
