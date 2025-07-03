
-- Update the user role enum to include all 10 specific roles
ALTER TYPE public.request_status RENAME TO request_status_old;
CREATE TYPE public.user_role AS ENUM (
  'bbt_execution_team',
  'bbt_operations', 
  'bbt_finance',
  'bbt_legal',
  'bbt_exec',
  'seller',
  'seller_legal',
  'seller_financial',
  'rsm',
  'hensen_efron'
);

-- Update profiles table to use the new role enum and add organization
ALTER TABLE public.profiles 
  ADD COLUMN organization TEXT,
  ADD COLUMN new_role user_role;

-- Migrate existing data
UPDATE public.profiles SET 
  new_role = CASE 
    WHEN role = 'admin' THEN 'bbt_execution_team'::user_role
    WHEN role = 'upload_only' THEN 'seller'::user_role
    WHEN role = 'view_only' THEN 'seller'::user_role
    ELSE 'seller'::user_role
  END,
  organization = CASE 
    WHEN role = 'admin' THEN 'BBT'
    ELSE 'Seller'
  END;

-- Drop old role column and rename new one
ALTER TABLE public.profiles DROP COLUMN role;
ALTER TABLE public.profiles RENAME COLUMN new_role TO role;
ALTER TABLE public.profiles ALTER COLUMN role SET NOT NULL;

-- Create deal_access table for granular permissions
CREATE TABLE public.deal_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  granted_by UUID REFERENCES public.profiles(id),
  UNIQUE(user_id, deal_id)
);

-- Enable RLS on deal_access
ALTER TABLE public.deal_access ENABLE ROW LEVEL SECURITY;

-- Create invitations table for user invitation system
CREATE TABLE public.invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  role user_role NOT NULL,
  organization TEXT NOT NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES public.profiles(id) NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on invitations
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Update the get_current_user_role function to handle new roles
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create function to check if user is BBT or affiliate (has global access)
CREATE OR REPLACE FUNCTION public.user_has_global_access()
RETURNS BOOLEAN AS $$
  SELECT organization IN ('BBT', 'RSM', 'Hensen & Efron') 
  FROM public.profiles 
  WHERE id = auth.uid() 
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create function to check if user has access to a specific deal
CREATE OR REPLACE FUNCTION public.user_has_deal_access(deal_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.deal_access da
    JOIN public.profiles p ON p.id = da.user_id
    WHERE da.user_id = auth.uid() 
    AND da.deal_id = deal_uuid
  ) OR public.user_has_global_access();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Update RLS policies for profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "BBT Execution Team can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (
    auth.uid() = id OR 
    public.get_current_user_role() = 'bbt_execution_team'
  );

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Update RLS policies for deals
DROP POLICY IF EXISTS "Admins can manage deals" ON public.deals;
DROP POLICY IF EXISTS "Users can view deals they created or are assigned to" ON public.deals;
DROP POLICY IF EXISTS "Users can create deals" ON public.deals;

CREATE POLICY "BBT Execution Team can manage all deals" 
  ON public.deals 
  FOR ALL 
  USING (public.get_current_user_role() = 'bbt_execution_team');

CREATE POLICY "BBT and affiliates can view all deals" 
  ON public.deals 
  FOR SELECT 
  USING (public.user_has_global_access());

CREATE POLICY "Sellers can view assigned deals" 
  ON public.deals 
  FOR SELECT 
  USING (public.user_has_deal_access(id));

CREATE POLICY "BBT Execution Team can create deals" 
  ON public.deals 
  FOR INSERT 
  WITH CHECK (public.get_current_user_role() = 'bbt_execution_team');

-- Update RLS policies for diligence_requests
DROP POLICY IF EXISTS "Admins can manage requests" ON public.diligence_requests;
DROP POLICY IF EXISTS "Users can view requests assigned to them" ON public.diligence_requests;

CREATE POLICY "BBT Execution Team can manage all requests" 
  ON public.diligence_requests 
  FOR ALL 
  USING (public.get_current_user_role() = 'bbt_execution_team');

CREATE POLICY "BBT and affiliates can view all requests" 
  ON public.diligence_requests 
  FOR SELECT 
  USING (public.user_has_global_access() AND public.user_has_deal_access(deal_id));

CREATE POLICY "Sellers can view assigned requests" 
  ON public.diligence_requests 
  FOR SELECT 
  USING (
    (auth.uid() = assigned_to OR auth.uid() = created_by) 
    AND public.user_has_deal_access(deal_id)
  );

-- RLS policies for deal_access table
CREATE POLICY "BBT Execution Team can manage deal access" 
  ON public.deal_access 
  FOR ALL 
  USING (public.get_current_user_role() = 'bbt_execution_team');

CREATE POLICY "Users can view their own deal access" 
  ON public.deal_access 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- RLS policies for invitations table
CREATE POLICY "BBT Execution Team can manage invitations" 
  ON public.invitations 
  FOR ALL 
  USING (public.get_current_user_role() = 'bbt_execution_team');

CREATE POLICY "Users can view invitations they sent" 
  ON public.invitations 
  FOR SELECT 
  USING (auth.uid() = invited_by);
