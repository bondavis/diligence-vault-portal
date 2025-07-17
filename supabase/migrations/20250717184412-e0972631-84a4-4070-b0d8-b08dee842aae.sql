-- Create table for BBT team comments on diligence requests
CREATE TABLE public.request_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.diligence_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.request_comments ENABLE ROW LEVEL SECURITY;

-- BBT team and admins can manage all comments
CREATE POLICY "BBT team can manage comments" 
ON public.request_comments 
FOR ALL 
USING ((get_current_user_role() = 'admin'::text) OR (get_current_user_role() = 'bbt_execution_team'::text));

-- Users can view comments on requests they have access to
CREATE POLICY "Users can view comments on accessible requests" 
ON public.request_comments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.diligence_requests dr 
  WHERE dr.id = request_comments.request_id 
  AND (dr.assigned_to = auth.uid() OR dr.created_by = auth.uid() OR get_current_user_role() = 'admin'::text)
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_request_comments_updated_at
BEFORE UPDATE ON public.request_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_questionnaire_updated_at();