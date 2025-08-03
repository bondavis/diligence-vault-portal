-- Create diligence_stages table
CREATE TABLE public.diligence_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL,
  completion_threshold INTEGER DEFAULT 80, -- percentage needed to unlock next stage
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on diligence_stages
ALTER TABLE public.diligence_stages ENABLE ROW LEVEL SECURITY;

-- Create policies for diligence_stages
CREATE POLICY "Everyone can view active stages" 
ON public.diligence_stages 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage stages" 
ON public.diligence_stages 
FOR ALL 
USING (get_current_user_role() = 'admin');

-- Add stage_id to diligence_requests table
ALTER TABLE public.diligence_requests 
ADD COLUMN stage_id UUID REFERENCES public.diligence_stages(id);

-- Create index for performance
CREATE INDEX idx_diligence_requests_stage_id ON public.diligence_requests(stage_id);

-- Insert default stages
INSERT INTO public.diligence_stages (name, description, sort_order) VALUES 
('Initial Review', 'Basic company information, high-level financials, and preliminary documentation', 1),
('Financial Deep Dive', 'Detailed financial analysis, cash flow statements, and accounting records', 2),
('Legal & Compliance', 'Legal documents, contracts, regulatory compliance, and intellectual property', 3),
('Operations & HR', 'Operational processes, human resources policies, and organizational structure', 4),
('Final Verification', 'Final documents, closing items, and verification of all materials', 5);

-- Update existing request templates to assign them to appropriate stages
UPDATE public.request_templates 
SET stage_id = (
  CASE 
    WHEN title ILIKE '%financial%' OR title ILIKE '%revenue%' OR title ILIKE '%profit%' OR title ILIKE '%cash%' OR title ILIKE '%accounting%' OR category = 'Financial' THEN 
      (SELECT id FROM public.diligence_stages WHERE name = 'Financial Deep Dive')
    WHEN title ILIKE '%legal%' OR title ILIKE '%contract%' OR title ILIKE '%compliance%' OR title ILIKE '%agreement%' OR category = 'Legal' THEN 
      (SELECT id FROM public.diligence_stages WHERE name = 'Legal & Compliance')
    WHEN title ILIKE '%employee%' OR title ILIKE '%hr%' OR title ILIKE '%organization%' OR title ILIKE '%operation%' OR category = 'HR' OR category = 'Operational' THEN 
      (SELECT id FROM public.diligence_stages WHERE name = 'Operations & HR')
    WHEN title ILIKE '%final%' OR title ILIKE '%closing%' OR title ILIKE '%verification%' THEN 
      (SELECT id FROM public.diligence_stages WHERE name = 'Final Verification')
    ELSE 
      (SELECT id FROM public.diligence_stages WHERE name = 'Initial Review')
  END
);

-- Add stage_id column to request_templates table
ALTER TABLE public.request_templates 
ADD COLUMN stage_id UUID REFERENCES public.diligence_stages(id);

-- Update existing diligence_requests to assign them to stages based on category
UPDATE public.diligence_requests 
SET stage_id = (
  CASE 
    WHEN title ILIKE '%financial%' OR title ILIKE '%revenue%' OR title ILIKE '%profit%' OR title ILIKE '%cash%' OR title ILIKE '%accounting%' OR category = 'Financial' THEN 
      (SELECT id FROM public.diligence_stages WHERE name = 'Financial Deep Dive')
    WHEN title ILIKE '%legal%' OR title ILIKE '%contract%' OR title ILIKE '%compliance%' OR title ILIKE '%agreement%' OR category = 'Legal' THEN 
      (SELECT id FROM public.diligence_stages WHERE name = 'Legal & Compliance')
    WHEN title ILIKE '%employee%' OR title ILIKE '%hr%' OR title ILIKE '%organization%' OR title ILIKE '%operation%' OR category = 'HR' OR category = 'Operational' THEN 
      (SELECT id FROM public.diligence_stages WHERE name = 'Operations & HR')
    WHEN title ILIKE '%final%' OR title ILIKE '%closing%' OR title ILIKE '%verification%' THEN 
      (SELECT id FROM public.diligence_stages WHERE name = 'Final Verification')
    ELSE 
      (SELECT id FROM public.diligence_stages WHERE name = 'Initial Review')
  END
);

-- Create function to update stage updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_stage_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates on stages
CREATE TRIGGER update_stages_updated_at
BEFORE UPDATE ON public.diligence_stages
FOR EACH ROW
EXECUTE FUNCTION public.update_stage_updated_at_column();