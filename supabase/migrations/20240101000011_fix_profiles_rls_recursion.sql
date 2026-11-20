-- Fix infinite recursion in profiles RLS policies
-- The admin policies were checking profiles.role which creates recursion
-- Solution: Create a SECURITY DEFINER function that bypasses RLS to check role

-- Create a function that checks if current user is admin
-- SECURITY DEFINER means it runs with the privileges of the function owner (bypassing RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Drop the problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;

-- Recreate admin policies using the SECURITY DEFINER function
-- This avoids the infinite recursion

CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  -- Allow if user is viewing their own profile OR if they are an admin
  auth.uid() = id OR public.is_admin()
);

CREATE POLICY "Admins can update all profiles"
ON profiles FOR UPDATE
TO authenticated
USING (
  public.is_admin()
)
WITH CHECK (
  public.is_admin()
);

CREATE POLICY "Admins can insert profiles"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin()
);
