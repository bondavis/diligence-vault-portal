
-- Create the deals table
CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  project_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  target_close_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for deals
CREATE POLICY "Users can view deals they created or are assigned to" ON public.deals
  FOR SELECT USING (
    auth.uid() = created_by OR
    public.get_current_user_role() = 'admin'
  );

CREATE POLICY "Admins can manage deals" ON public.deals
  FOR ALL USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Users can create deals" ON public.deals
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Create indexes for better performance
CREATE INDEX idx_deals_created_by ON public.deals(created_by);
CREATE INDEX idx_deals_created_at ON public.deals(created_at);
