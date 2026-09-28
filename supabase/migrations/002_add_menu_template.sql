-- Migration: Add menu_template column to restaurants table
-- This allows each restaurant to choose a different customer-facing menu template.

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS menu_template TEXT NOT NULL DEFAULT 'classic'
    CHECK (menu_template IN ('classic', 'menuly-dark'));

COMMENT ON COLUMN restaurants.menu_template IS
  'The template key used to render the public customer-facing menu page. Currently supported: classic, menuly-dark.';
