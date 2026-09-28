-- Migration: Add is_veg column to menu_items table
-- Allows tagging each menu item as vegetarian (true), non-vegetarian (false),
-- or unspecified (null — displays as veg by default in the UI).

ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS is_veg BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN menu_items.is_veg IS
  'TRUE = vegetarian (green dot), FALSE = non-vegetarian (red dot), NULL = not specified (defaults to green).';
