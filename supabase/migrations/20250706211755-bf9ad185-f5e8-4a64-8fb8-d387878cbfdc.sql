-- Create enum for questionnaire categories
CREATE TYPE public.questionnaire_category AS ENUM (
  'Business Snapshot',
  'Key Metrics', 
  'Service Mix',
  'Sales',
  'HR',
  'Operational',
  'Customer Experience',
  'Marketing',
  'Technology & Systems',
  'Facilities & Equipment',
  'Compliance/Insurance/Safety',
  'Deal Specific'
);

-- Create enum for question types
CREATE TYPE public.question_type AS ENUM (
  'text',
  'textarea',
  'number',
  'select',
  'radio',
  'checkbox',
  'yes_no'
);

-- Create enum for responsible party
CREATE TYPE public.responsible_party AS ENUM (
  'M&A',
  'Ops'
);

-- Create questionnaire questions table
CREATE TABLE public.questionnaire_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_text TEXT NOT NULL,
  category questionnaire_category NOT NULL DEFAULT 'Deal Specific',
  question_type question_type NOT NULL DEFAULT 'text',
  responsible_party responsible_party DEFAULT 'M&A',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_required BOOLEAN NOT NULL DEFAULT false,
  options JSONB, -- For select/radio options
  help_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Create questionnaire responses table
CREATE TABLE public.questionnaire_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL,
  question_id UUID NOT NULL REFERENCES public.questionnaire_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  response_value TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(deal_id, question_id, user_id)
);

-- Create questionnaire sessions table for save/resume functionality
CREATE TABLE public.questionnaire_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL,
  user_id UUID NOT NULL,
  current_question_id UUID REFERENCES public.questionnaire_questions(id),
  is_completed BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(deal_id, user_id)
);

-- Enable RLS
ALTER TABLE public.questionnaire_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for questionnaire_questions
CREATE POLICY "Admins can manage questionnaire questions"
ON public.questionnaire_questions
FOR ALL
USING (get_current_user_role() = 'admin' OR get_current_user_role() = 'bbt_execution_team');

CREATE POLICY "Users can view active questionnaire questions"
ON public.questionnaire_questions
FOR SELECT
USING (is_active = true);

-- RLS Policies for questionnaire_responses
CREATE POLICY "Users can manage their own responses"
ON public.questionnaire_responses
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all responses"
ON public.questionnaire_responses
FOR SELECT
USING (get_current_user_role() = 'admin' OR get_current_user_role() = 'bbt_execution_team');

-- RLS Policies for questionnaire_sessions
CREATE POLICY "Users can manage their own sessions"
ON public.questionnaire_sessions
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions"
ON public.questionnaire_sessions
FOR SELECT
USING (get_current_user_role() = 'admin' OR get_current_user_role() = 'bbt_execution_team');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_questionnaire_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_questionnaire_questions_updated_at
  BEFORE UPDATE ON public.questionnaire_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_questionnaire_updated_at();

CREATE TRIGGER update_questionnaire_responses_updated_at
  BEFORE UPDATE ON public.questionnaire_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_questionnaire_updated_at();

CREATE TRIGGER update_questionnaire_sessions_updated_at
  BEFORE UPDATE ON public.questionnaire_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_questionnaire_updated_at();