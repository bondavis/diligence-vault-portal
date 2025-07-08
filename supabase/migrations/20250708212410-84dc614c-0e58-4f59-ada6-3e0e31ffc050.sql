-- Add organization field to profiles table and invitation status tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization text;

-- Add invitation status tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS invitation_status text DEFAULT 'active' CHECK (invitation_status IN ('pending', 'active', 'inactive'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS invited_by uuid REFERENCES auth.users(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS invited_at timestamp with time zone DEFAULT now();

-- Create user_deals junction table for many-to-many relationship between users and deals
CREATE TABLE IF NOT EXISTS public.user_deals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  assigned_by uuid NOT NULL REFERENCES auth.users(id),
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  role_in_deal text NOT NULL DEFAULT 'participant',
  UNIQUE(user_id, deal_id)
);

-- Enable RLS on user_deals table
ALTER TABLE public.user_deals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_deals
CREATE POLICY "Users can view their own deal assignments" 
ON public.user_deals 
FOR SELECT 
USING (auth.uid() = user_id OR get_current_user_role() = 'admin');

CREATE POLICY "Admins can manage deal assignments" 
ON public.user_deals 
FOR ALL 
USING (get_current_user_role() = 'admin');

CREATE POLICY "Deal creators can assign users to their deals" 
ON public.user_deals 
FOR INSERT 
WITH CHECK (
  auth.uid() = assigned_by AND 
  (get_current_user_role() = 'admin' OR 
   EXISTS (
     SELECT 1 FROM deals d 
     WHERE d.id = user_deals.deal_id 
     AND (d.created_by = auth.uid() OR get_current_user_role() = 'admin')
   ))
);

-- Create a function to send invitation emails (placeholder for now)
CREATE OR REPLACE FUNCTION public.send_user_invitation(
  user_email text,
  user_name text,
  deal_id uuid,
  deal_name text,
  invited_by_email text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This is a placeholder function that will be enhanced with actual email sending
  -- For now, it just logs the invitation
  RAISE LOG 'User invitation - Email: %, Deal: %, Invited by: %', user_email, deal_name, invited_by_email;
END;
$$;