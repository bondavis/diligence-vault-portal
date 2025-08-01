-- Create table to track template applications to deals
CREATE TABLE public.deal_template_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL,
  applied_by UUID NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  template_version TEXT DEFAULT 'v1',
  notes TEXT
);

-- Enable Row Level Security
ALTER TABLE public.deal_template_applications ENABLE ROW LEVEL SECURITY;

-- Create policies for template applications
CREATE POLICY "Users can view template applications for their deals" 
ON public.deal_template_applications 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM deals d 
    WHERE d.id = deal_template_applications.deal_id 
    AND (d.created_by = auth.uid() OR get_current_user_role() = 'admin')
  )
);

CREATE POLICY "Users can create template applications for their deals" 
ON public.deal_template_applications 
FOR INSERT 
WITH CHECK (
  auth.uid() = applied_by AND
  EXISTS (
    SELECT 1 FROM deals d 
    WHERE d.id = deal_template_applications.deal_id 
    AND (d.created_by = auth.uid() OR get_current_user_role() = 'admin')
  )
);

CREATE POLICY "Admins can manage all template applications" 
ON public.deal_template_applications 
FOR ALL 
USING (get_current_user_role() = 'admin');

-- Create index for better performance
CREATE INDEX idx_deal_template_applications_deal_id ON public.deal_template_applications(deal_id);
CREATE INDEX idx_deal_template_applications_applied_at ON public.deal_template_applications(applied_at DESC);