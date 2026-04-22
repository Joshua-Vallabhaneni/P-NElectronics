-- ============================================
-- MIGRATION: Admin Roles & Inventory Management
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Update handle_new_user to auto-assign admin role for specific emails
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    CASE WHEN NEW.email IN ('pjvallabhaneni@gmail.com', 'pnelectronicsllc@gmail.com', 'dilanparikh28@gmail.com')
         THEN 'admin' ELSE 'user' END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update existing admin users (run if already signed up)
UPDATE user_profiles SET role = 'admin'
WHERE email IN ('pjvallabhaneni@gmail.com', 'pnelectronicsllc@gmail.com', 'dilanparikh28@gmail.com');

-- 3. Allow admins to read all user profiles (for role checks)
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );

-- 4. Allow users to read their own profile (may already exist, using IF NOT EXISTS pattern)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own profile' AND tablename = 'user_profiles'
  ) THEN
    CREATE POLICY "Users can view their own profile"
      ON user_profiles FOR SELECT
      USING (auth.uid() = id);
  END IF;
END $$;

-- ============================================
-- VERIFIED ITEMS TABLE
-- Items accepted from user submissions, ready for listing
-- ============================================
CREATE TABLE IF NOT EXISTS verified_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quote_request_id UUID REFERENCES quote_requests(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  processor TEXT,
  ram TEXT,
  storage TEXT,
  condition TEXT NOT NULL,
  quantity INTEGER DEFAULT 1 CHECK (quantity >= 0),
  quoted_price DECIMAL(10, 2),
  admin_notes TEXT,
  images TEXT[],
  is_listed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE verified_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage verified_items"
  ON verified_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- ============================================
-- LOTS TABLE
-- Bundles of items sold together
-- ============================================
CREATE TABLE IF NOT EXISTS lots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lot_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  total_price DECIMAL(10, 2),
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE lots ENABLE ROW LEVEL SECURITY;

-- Lots are publicly readable (when available)
CREATE POLICY "Available lots are publicly readable"
  ON lots FOR SELECT
  TO PUBLIC
  USING (is_available = true);

CREATE POLICY "Admins can manage lots"
  ON lots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- ============================================
-- LOT ITEMS TABLE
-- Junction table linking items to lots
-- ============================================
CREATE TABLE IF NOT EXISTS lot_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lot_id UUID REFERENCES lots(id) ON DELETE CASCADE,
  verified_item_id UUID REFERENCES verified_items(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER DEFAULT 1 CHECK (quantity >= 1)
);

ALTER TABLE lot_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage lot_items"
  ON lot_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Public can read lot items for available lots
CREATE POLICY "Public can read lot_items for available lots"
  ON lot_items FOR SELECT
  TO PUBLIC
  USING (
    EXISTS (
      SELECT 1 FROM lots
      WHERE lots.id = lot_items.lot_id
      AND lots.is_available = true
    )
  );

-- ============================================
-- TRIGGERS for updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_verified_items_updated_at ON verified_items;
CREATE TRIGGER update_verified_items_updated_at
  BEFORE UPDATE ON verified_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lots_updated_at ON lots;
CREATE TRIGGER update_lots_updated_at
  BEFORE UPDATE ON lots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_verified_items_listed ON verified_items(is_listed);
CREATE INDEX IF NOT EXISTS idx_verified_items_quote ON verified_items(quote_request_id);
CREATE INDEX IF NOT EXISTS idx_lot_items_lot ON lot_items(lot_id);
CREATE INDEX IF NOT EXISTS idx_lots_available ON lots(is_available);

-- ============================================
-- GRANTS
-- ============================================
GRANT ALL ON verified_items TO authenticated;
GRANT ALL ON lots TO authenticated;
GRANT ALL ON lot_items TO authenticated;
GRANT SELECT ON lots TO anon;
GRANT SELECT ON lot_items TO anon;
