
-- Drop the current admin policy that still has potential recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create a security definer function to get the current user's role
-- This prevents recursion by bypassing RLS when called
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create the admin policy using the security definer function
CREATE POLICY "Admins can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (
    -- Allow if user is viewing their own profile OR if they have admin role
    auth.uid() = id OR 
    public.get_current_user_role() = 'admin'
  );
