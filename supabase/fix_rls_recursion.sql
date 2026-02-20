-- ============================================
-- FIX: Infinite Recursion in user_profiles RLS
-- Run this in your Supabase SQL Editor
-- ============================================

-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;

-- Recreate with simple, non-recursive policies
-- Users can always read their own profile (no subquery needed)
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Also fix the admin check policies on other tables to avoid recursion.
-- Instead of subquerying user_profiles (which triggers its own RLS),
-- we use a SECURITY DEFINER function that bypasses RLS.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Now re-create the admin policies on other tables using the function
DROP POLICY IF EXISTS "Admins can manage verified_items" ON verified_items;
CREATE POLICY "Admins can manage verified_items"
  ON verified_items FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage lots" ON lots;
CREATE POLICY "Admins can manage lots"
  ON lots FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage lot_items" ON lot_items;
CREATE POLICY "Admins can manage lot_items"
  ON lot_items FOR ALL
  USING (public.is_admin());

-- Fix any existing admin policies on products and quote_requests too
DROP POLICY IF EXISTS "Admins can manage all products" ON products;
CREATE POLICY "Admins can manage all products"
  ON products FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all quote_requests" ON quote_requests;
CREATE POLICY "Admins can view all quote_requests"
  ON quote_requests FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update quote_requests" ON quote_requests;
CREATE POLICY "Admins can update quote_requests"
  ON quote_requests FOR UPDATE
  USING (public.is_admin());
