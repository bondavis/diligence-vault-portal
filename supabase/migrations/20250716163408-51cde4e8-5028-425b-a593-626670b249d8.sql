-- Update the INSERT policy for profiles to allow admins to create profiles for other users
DROP POLICY IF EXISTS "New users can insert their own profile" ON public.profiles;

CREATE POLICY "Users and admins can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  auth.uid() = id OR get_current_user_role() = 'admin'
);