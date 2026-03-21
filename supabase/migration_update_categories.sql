-- Migration: Update categories to laptop, desktop, gpu, phone, other
-- Remove old categories that are no longer used
DELETE FROM categories WHERE slug IN ('monitor', 'server', 'printer');

-- Add new categories
INSERT INTO categories (name, slug, description, icon) VALUES
  ('GPUs', 'gpu', 'Graphics processing units', 'Cpu'),
  ('Phones', 'phone', 'Smartphones and mobile devices', 'Smartphone'),
  ('Other', 'other', 'Other IT equipment and assets', 'Package')
ON CONFLICT (slug) DO NOTHING;

-- Update existing category icons/descriptions if needed
UPDATE categories SET icon = 'HardDrive', description = 'Desktop computers and workstations' WHERE slug = 'desktop';
