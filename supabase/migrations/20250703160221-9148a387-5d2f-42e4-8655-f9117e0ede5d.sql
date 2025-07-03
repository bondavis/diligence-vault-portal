
-- Create table for tracking documents attached to requests
CREATE TABLE public.request_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.diligence_requests(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  box_file_id TEXT, -- Will store Box file ID when synced
  box_folder_id TEXT, -- Will store Box folder ID
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_sample_document BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT request_documents_uploaded_by_fkey 
    FOREIGN KEY (uploaded_by) REFERENCES auth.users(id)
);

-- Enable RLS on request_documents
ALTER TABLE public.request_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for request_documents
CREATE POLICY "Users can view documents for assigned requests" 
  ON public.request_documents 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.diligence_requests dr 
      WHERE dr.id = request_documents.request_id 
      AND (dr.assigned_to = auth.uid() OR dr.created_by = auth.uid() OR get_current_user_role() = 'admin')
    )
  );

CREATE POLICY "Users can upload documents to assigned requests" 
  ON public.request_documents 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = uploaded_by AND
    EXISTS (
      SELECT 1 FROM public.diligence_requests dr 
      WHERE dr.id = request_documents.request_id 
      AND (dr.assigned_to = auth.uid() OR dr.created_by = auth.uid() OR get_current_user_role() = 'admin')
    )
  );

CREATE POLICY "Admins can manage all documents" 
  ON public.request_documents 
  FOR ALL 
  USING (get_current_user_role() = 'admin');

-- Add period field to diligence_requests for better period tracking
ALTER TABLE public.diligence_requests 
ADD COLUMN period_start DATE,
ADD COLUMN period_end DATE;

-- Create storage bucket for request documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('request-documents', 'request-documents', false);

-- Create storage policies
CREATE POLICY "Authenticated users can upload files" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = 'request-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view files for their requests" 
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

CREATE POLICY "Admins can manage all request files" 
  ON storage.objects 
  FOR ALL 
  USING (bucket_id = 'request-documents' AND get_current_user_role() = 'admin');
