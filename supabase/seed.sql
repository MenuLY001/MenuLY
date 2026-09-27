-- ============================================================
-- QR Menu Platform — Seed Data (Demo)
-- Run AFTER creating admin users in Supabase Auth dashboard.
-- Replace the user_id values with real UUIDs from auth.users.
-- ============================================================

-- Demo Restaurant 1: Spice Route
INSERT INTO restaurants (id, slug, name, theme_color, ordering_enabled)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'spice-route-8f3a',
  'Spice Route',
  '#e67e22',
  FALSE
) ON CONFLICT (id) DO NOTHING;

-- Demo Restaurant 2: The Green Bowl
INSERT INTO restaurants (id, slug, name, theme_color, ordering_enabled)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000002',
  'green-bowl-9c2b',
  'The Green Bowl',
  '#16a34a',
  FALSE
) ON CONFLICT (id) DO NOTHING;

-- ─── restaurant_admins ────────────────────────────────────────────────────────
-- IMPORTANT: Replace these user_id values with real UUIDs from auth.users
-- after creating the admin accounts in Supabase Auth dashboard.
--
-- INSERT INTO restaurant_admins (user_id, restaurant_id) VALUES
--   ('REPLACE-WITH-USER-UUID', 'a1b2c3d4-0000-0000-0000-000000000001'),
--   ('REPLACE-WITH-USER-UUID', 'a1b2c3d4-0000-0000-0000-000000000002');

-- ─── Categories for Spice Route ──────────────────────────────────────────────

INSERT INTO categories (id, restaurant_id, name, sort_order) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'Starters', 0),
  ('c0000001-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000001', 'Mains', 1),
  ('c0000001-0000-0000-0000-000000000003', 'a1b2c3d4-0000-0000-0000-000000000001', 'Breads', 2),
  ('c0000001-0000-0000-0000-000000000004', 'a1b2c3d4-0000-0000-0000-000000000001', 'Drinks', 3)
ON CONFLICT (id) DO NOTHING;

-- ─── Menu Items for Spice Route ──────────────────────────────────────────────

INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_available, sort_order) VALUES
  -- Starters
  ('a1b2c3d4-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001',
   'Paneer Tikka', 'Fresh paneer cubes marinated in spiced yogurt, grilled in tandoor', 180, TRUE, 0),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001',
   'Veg Seekh Kebab', 'Mixed vegetable and herb kebabs, chargrilled with aromatic spices', 160, TRUE, 1),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001',
   'Hara Bhara Kebab', 'Spinach and pea patties with mint chutney', 150, TRUE, 2),
  -- Mains
  ('a1b2c3d4-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000002',
   'Dal Makhani', 'Slow-cooked black lentils in rich tomato and cream gravy', 220, TRUE, 0),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000002',
   'Palak Paneer', 'Cottage cheese in silky spinach gravy', 240, TRUE, 1),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000002',
   'Butter Chicken', 'Tender chicken in velvety tomato-butter sauce', 280, TRUE, 2),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000002',
   'Seasonal Special', 'Ask your waiter — changes daily', 200, FALSE, 3),
  -- Breads
  ('a1b2c3d4-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000003',
   'Butter Naan', 'Soft leavened bread from the tandoor', 60, TRUE, 0),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000003',
   'Garlic Naan', 'Naan topped with fresh garlic and coriander butter', 70, TRUE, 1),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000003',
   'Tandoori Roti', 'Whole-wheat bread baked in the tandoor', 40, TRUE, 2),
  -- Drinks
  ('a1b2c3d4-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000004',
   'Sweet Lassi', 'Chilled yogurt drink with rose water and cardamom', 80, TRUE, 0),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000004',
   'Masala Chai', 'Spiced Indian tea with ginger and cardamom', 50, TRUE, 1),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000004',
   'Fresh Lime Soda', 'Sparkling water with fresh lime and mint', 60, TRUE, 2);

-- ─── Categories for The Green Bowl ──────────────────────────────────────────

INSERT INTO categories (id, restaurant_id, name, sort_order) VALUES
  ('c0000002-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000002', 'Salads', 0),
  ('c0000002-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000002', 'Bowls', 1),
  ('c0000002-0000-0000-0000-000000000003', 'a1b2c3d4-0000-0000-0000-000000000002', 'Smoothies', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_available, sort_order) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000002', 'c0000002-0000-0000-0000-000000000001',
   'Quinoa Salad', 'Quinoa, roasted veggies, lemon tahini dressing', 280, TRUE, 0),
  ('a1b2c3d4-0000-0000-0000-000000000002', 'c0000002-0000-0000-0000-000000000002',
   'Buddha Bowl', 'Brown rice, falafel, hummus, roasted chickpeas, cucumber', 320, TRUE, 0),
  ('a1b2c3d4-0000-0000-0000-000000000002', 'c0000002-0000-0000-0000-000000000003',
   'Mango Smoothie', 'Fresh mango, banana, coconut milk', 150, TRUE, 0);
