
-- Create a table for master request templates
CREATE TABLE public.request_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category request_category NOT NULL DEFAULT 'Other',
  priority request_priority NOT NULL DEFAULT 'medium',
  typical_period TEXT,
  allow_file_upload BOOLEAN NOT NULL DEFAULT true,
  allow_text_response BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) to ensure only admins can manage templates
ALTER TABLE public.request_templates ENABLE ROW LEVEL SECURITY;

-- Create policy that allows admins to manage templates
CREATE POLICY "Admins can manage request templates" 
  ON public.request_templates 
  FOR ALL 
  USING (get_current_user_role() = 'admin');

-- Create policy that allows users to view templates (for reference)
CREATE POLICY "Users can view request templates" 
  ON public.request_templates 
  FOR SELECT 
  USING (true);

-- Add an index for better performance
CREATE INDEX idx_request_templates_category ON public.request_templates(category);
CREATE INDEX idx_request_templates_sort_order ON public.request_templates(sort_order);
