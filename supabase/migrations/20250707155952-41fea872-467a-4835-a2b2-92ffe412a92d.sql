-- Add missing RLS policies for comprehensive security

-- Add missing policies for diligence_requests table
CREATE POLICY "Users can insert requests for their deals" 
  ON public.diligence_requests 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = created_by AND
    (get_current_user_role() = 'admin' OR 
     EXISTS (
       SELECT 1 FROM public.deals d 
       WHERE d.id = deal_id AND (d.created_by = auth.uid() OR get_current_user_role() = 'admin')
     ))
  );

CREATE POLICY "Users can update requests assigned to them" 
  ON public.diligence_requests 
  FOR UPDATE 
  USING (
    auth.uid() = assigned_to OR 
    auth.uid() = created_by OR 
    get_current_user_role() = 'admin'
  );

-- Add missing policies for questionnaire_questions table  
CREATE POLICY "Only admins can insert questionnaire questions" 
  ON public.questionnaire_questions 
  FOR INSERT 
  WITH CHECK (get_current_user_role() = 'admin' OR get_current_user_role() = 'bbt_execution_team');

CREATE POLICY "Only admins can update questionnaire questions" 
  ON public.questionnaire_questions 
  FOR UPDATE 
  USING (get_current_user_role() = 'admin' OR get_current_user_role() = 'bbt_execution_team');

CREATE POLICY "Only admins can delete questionnaire questions" 
  ON public.questionnaire_questions 
  FOR DELETE 
  USING (get_current_user_role() = 'admin' OR get_current_user_role() = 'bbt_execution_team');

-- Add missing policies for profiles table
CREATE POLICY "New users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Enhanced file upload security policies
DROP POLICY IF EXISTS "Users can upload documents to assigned requests" ON public.request_documents;

CREATE POLICY "Users can upload documents to assigned requests" 
  ON public.request_documents 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = uploaded_by AND
    EXISTS (
      SELECT 1 FROM public.diligence_requests dr 
      WHERE dr.id = request_documents.request_id 
      AND (dr.assigned_to = auth.uid() OR dr.created_by = auth.uid() OR get_current_user_role() = 'admin')
    ) AND
    -- File size limit (50MB)
    file_size <= 52428800 AND
    -- Allowed file types only
    file_type IN (
      'application/pdf', 'application/vnd.ms-excel', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'text/csv', 'image/jpeg', 'image/png', 'image/gif'
    )
  );

-- Add policy for updating documents (only metadata, not files)
CREATE POLICY "Users can update their uploaded documents metadata" 
  ON public.request_documents 
  FOR UPDATE 
  USING (
    auth.uid() = uploaded_by OR get_current_user_role() = 'admin'
  );

-- Add policy for deleting documents
CREATE POLICY "Users can delete their uploaded documents" 
  ON public.request_documents 
  FOR DELETE 
  USING (
    auth.uid() = uploaded_by OR get_current_user_role() = 'admin'
  );

-- Enhanced storage policies with better security
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view files for their requests" ON storage.objects;

CREATE POLICY "Restricted file uploads" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'request-documents' AND 
    auth.role() = 'authenticated' AND
    -- Only allow files with proper paths (deal_id/request_id/filename)
    array_length(string_to_array(name, '/'), 1) = 3
  );

CREATE POLICY "Secure file access" 
  ON storage.objects 
  FOR SELECT 
  USING (
    bucket_id = 'request-documents' AND
    EXISTS (
      SELECT 1 FROM public.request_documents rd
      JOIN public.diligence_requests dr ON rd.request_id = dr.id
      WHERE rd.storage_path = name 
      AND (dr.assigned_to = auth.uid() OR dr.created_by = auth.uid() OR get_current_user_role() = 'admin')
    )
  );

-- Add audit logging function for security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type TEXT,
  user_id UUID,
  details JSONB DEFAULT '{}'::jsonb
) RETURNS VOID AS $$
BEGIN
  -- This could be expanded to write to an audit log table
  -- For now, it's a placeholder that can be enhanced
  RAISE LOG 'Security Event - Type: %, User: %, Details: %', event_type, user_id, details;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;