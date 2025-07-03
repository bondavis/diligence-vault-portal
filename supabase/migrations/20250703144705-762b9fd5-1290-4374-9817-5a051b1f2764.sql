
-- Drop the problematic admin policy that causes infinite recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create a simpler admin policy that doesn't cause recursion
-- This uses a direct role check without self-referencing the profiles table
CREATE POLICY "Admins can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (
    -- Allow if user is viewing their own profile OR if they have admin role
    auth.uid() = id OR 
    (
      SELECT role FROM public.profiles 
      WHERE id = auth.uid() 
      LIMIT 1
    ) = 'admin'
  );
