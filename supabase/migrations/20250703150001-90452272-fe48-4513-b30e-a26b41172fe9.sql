
-- Create enum types for better data consistency
CREATE TYPE public.request_priority AS ENUM ('high', 'medium', 'low');
CREATE TYPE public.request_status AS ENUM ('pending', 'submitted', 'approved', 'rejected');
CREATE TYPE public.request_category AS ENUM ('Financial', 'Legal', 'Operations', 'HR', 'IT', 'Environmental', 'Commercial', 'Other');

-- Create deals table to organize requests by deal
CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  target_close_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) NOT NULL
);

-- Create diligence_requests table
CREATE TABLE public.diligence_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category public.request_category NOT NULL DEFAULT 'Other',
  priority public.request_priority NOT NULL DEFAULT 'medium',
  status public.request_status NOT NULL DEFAULT 'pending',
  due_date DATE,
  assigned_to UUID REFERENCES auth.users(id),
  allow_file_upload BOOLEAN NOT NULL DEFAULT true,
  allow_text_response BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) NOT NULL
);

-- Create diligence_responses table to store user responses
CREATE TABLE public.diligence_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES public.diligence_requests(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  text_response TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(request_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diligence_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diligence_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deals
CREATE POLICY "Users can view deals they're assigned to" ON public.deals
  FOR SELECT USING (
    auth.uid() IN (
      SELECT DISTINCT assigned_to FROM public.diligence_requests WHERE deal_id = deals.id
    ) OR 
    auth.uid() = created_by OR
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can manage deals" ON public.deals
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for diligence_requests
CREATE POLICY "Users can view requests assigned to them" ON public.diligence_requests
  FOR SELECT USING (
    auth.uid() = assigned_to OR 
    auth.uid() = created_by OR
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can manage requests" ON public.diligence_requests
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for diligence_responses
CREATE POLICY "Users can manage their own responses" ON public.diligence_responses
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all responses" ON public.diligence_responses
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes for better performance
CREATE INDEX idx_diligence_requests_deal_id ON public.diligence_requests(deal_id);
CREATE INDEX idx_diligence_requests_assigned_to ON public.diligence_requests(assigned_to);
CREATE INDEX idx_diligence_requests_status ON public.diligence_requests(status);
CREATE INDEX idx_diligence_responses_request_id ON public.diligence_responses(request_id);
