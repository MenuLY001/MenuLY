-- Migration: Add is_special column to menu_items
-- Items marked as special appear in the "Today's Special" horizontal scroll section.

ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS is_special BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN menu_items.is_special IS
  'When TRUE, item appears in the "Today''s Special" section on the Menuly Dark template.';
