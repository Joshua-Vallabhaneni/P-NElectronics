-- P&N Electronics - Supabase Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USER PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Categories are publicly readable
CREATE POLICY "Categories are publicly readable"
  ON categories FOR SELECT
  TO PUBLIC
  USING (true);

-- Only admins can modify categories
CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Insert default categories
INSERT INTO categories (name, slug, description, icon) VALUES
  ('Laptops', 'laptop', 'Business and consumer laptops', 'Laptop'),
  ('Desktops', 'desktop', 'Desktop computers and workstations', 'HardDrive'),
  ('GPUs', 'gpu', 'Graphics processing units', 'Cpu'),
  ('Phones', 'phone', 'Smartphones and mobile devices', 'Smartphone'),
  ('Other', 'other', 'Other IT equipment and assets', 'Package')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  brand TEXT,
  model TEXT,
  processor TEXT,
  ram TEXT,
  storage TEXT,
  condition TEXT NOT NULL CHECK (condition IN ('A', 'B', 'refurbished', 'parts')),
  quantity INTEGER DEFAULT 1 CHECK (quantity >= 0),
  price DECIMAL(10, 2),
  is_bulk_lot BOOLEAN DEFAULT FALSE,
  lot_number TEXT,
  images TEXT[],
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Products are publicly readable (only available ones)
CREATE POLICY "Available products are publicly readable"
  ON products FOR SELECT
  TO PUBLIC
  USING (is_available = true);

-- Admins can see all products
CREATE POLICY "Admins can view all products"
  ON products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Only admins can modify products
CREATE POLICY "Admins can manage products"
  ON products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_condition ON products(condition);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available);

-- ============================================
-- QUOTE REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS quote_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_name TEXT,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  brand_model TEXT,
  processor TEXT,
  ram TEXT,
  storage_type TEXT,
  condition TEXT NOT NULL,
  spreadsheet_url TEXT,
  image_urls TEXT[],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'quoted', 'accepted', 'rejected')),
  quoted_price DECIMAL(10, 2),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on quote_requests
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can create a quote request (anonymous submissions allowed)
CREATE POLICY "Anyone can create quote requests"
  ON quote_requests FOR INSERT
  TO PUBLIC
  WITH CHECK (true);

-- Only admins can view quote requests
CREATE POLICY "Admins can view quote requests"
  ON quote_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Only admins can update quote requests
CREATE POLICY "Admins can update quote requests"
  ON quote_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_created ON quote_requests(created_at DESC);

-- ============================================
-- STORAGE BUCKET SETUP
-- ============================================
-- Note: Run these in the Supabase Dashboard > Storage > Create Bucket

-- Create 'uploads' bucket for product images and quote attachments
-- Settings: Public bucket, allowed MIME types: image/*, application/vnd.ms-excel, 
--           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_quote_requests_updated_at ON quote_requests;
CREATE TRIGGER update_quote_requests_updated_at
  BEFORE UPDATE ON quote_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- GRANT ANONYMOUS ACCESS FOR PUBLIC OPERATIONS
-- ============================================
-- Allow anonymous users to insert quote requests
GRANT INSERT ON quote_requests TO anon;

-- Allow anonymous users to read public data
GRANT SELECT ON categories TO anon;
GRANT SELECT ON products TO anon;

-- ============================================
-- MAKE A USER AN ADMIN (Run manually after signup)
-- ============================================
-- UPDATE user_profiles SET role = 'admin' WHERE email = 'your-admin-email@example.com';
