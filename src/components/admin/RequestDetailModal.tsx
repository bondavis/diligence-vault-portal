
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileUploadZone } from '../upload/FileUploadZone';
import { DocumentList } from './DocumentList';
import { User, Calendar, FileText, Send } from 'lucide-react';

interface RequestDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string | null;
  onRequestUpdate?: () => void;
}

export const RequestDetailModal = ({
  open,
  onOpenChange,
  requestId,
  onRequestUpdate
}: RequestDetailModalProps) => {
  const [request, setRequest] = useState<any>(null);
  const [response, setResponse] = useState<any>(null);
  const [assignedUser, setAssignedUser] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [textResponse, setTextResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && requestId) {
      loadRequestDetails();
    }
  }, [open, requestId]);

  const loadRequestDetails = async () => {
    if (!requestId) return;

    try {
      setLoading(true);
      
      // Load request
      const { data: requestData, error: requestError } = await supabase
        .from('diligence_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError) throw requestError;

      // Load assigned user if exists
      let assignedUserData = null;
      if (requestData.assigned_to) {
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', requestData.assigned_to)
          .single();

        if (!userError) {
          assignedUserData = userData;
        }
      }

      // Load user response if exists
      const { data: responseData, error: responseError } = await supabase
        .from('diligence_responses')
        .select('*')
        .eq('request_id', requestId)
        .maybeSingle();

      if (responseError && responseError.code !== 'PGRST116') throw responseError;

      // Load documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('request_documents')
        .select('*')
        .eq('request_id', requestId)
        .order('uploaded_at', { ascending: false });

      if (documentsError) throw documentsError;

      setRequest(requestData);
      setAssignedUser(assignedUserData);
      setResponse(responseData);
      setDocuments(documentsData || []);
      setTextResponse(responseData?.text_response || '');
    } catch (error) {
      console.error('Error loading request details:', error);
      toast({
        title: "Error",
        description: "Failed to load request details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTextResponseSubmit = async () => {
    if (!requestId || !textResponse.trim()) return;

    try {
      setSubmitting(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (response) {
        // Update existing response
        const { error } = await supabase
          .from('diligence_responses')
          .update({ text_response: textResponse })
          .eq('id', response.id);

        if (error) throw error;
      } else {
        // Create new response
        const { error } = await supabase
          .from('diligence_responses')
          .insert({
            request_id: requestId,
            user_id: user.id,
            text_response: textResponse
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Response submitted successfully",
      });

      loadRequestDetails();
      if (onRequestUpdate) {
        onRequestUpdate();
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        title: "Error",
        description: "Failed to submit response",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatPeriod = (startDate: string | null, endDate: string | null) => {
    if (!startDate && !endDate) return 'No period set';
    
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    if (start && end) {
      const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
      const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
      const startYear = start.getFullYear();
      const endYear = end.getFullYear();
      
      if (startYear === endYear) {
        return `${startMonth} - ${endMonth} ${startYear}`;
      } else {
        return `${startMonth} ${startYear} - ${endMonth} ${endYear}`;
      }
    }
    
    if (start) return start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    if (end) return `Until ${end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
    
    return 'Period not set';
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': 
        return <Badge className="bg-red-500 text-white">HIGH</Badge>;
      case 'medium': 
        return <Badge className="bg-orange-500 text-white">MEDIUM</Badge>;
      case 'low': 
        return <Badge className="bg-green-500 text-white">LOW</Badge>;
      default: 
        return <Badge variant="outline">{priority?.toUpperCase()}</Badge>;
    }
  };

  const computeStatus = () => {
    const hasDocuments = documents.length > 0;
    const hasResponse = response?.text_response;
    
    if (request?.status === 'approved') return 'Accepted';
    if (hasDocuments || hasResponse) return 'Review Pending';
    return 'Incomplete';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Incomplete': 
        return <Badge className="bg-gray-100 text-gray-800">Incomplete</Badge>;
      case 'Review Pending': 
        return <Badge className="bg-blue-100 text-blue-800">Review Pending</Badge>;
      case 'Accepted': 
        return <Badge className="bg-green-100 text-green-800">Accepted</Badge>;
      default: 
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleUploadComplete = () => {
    loadRequestDetails();
    if (onRequestUpdate) {
      onRequestUpdate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Request Details</DialogTitle>
          <DialogDescription className="sr-only">
            Complete information and document management for this diligence request
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="p-6">Loading request details...</div>
        ) : request ? (
          <div className="space-y-6">
            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900">{request.title}</h1>

            {/* Description */}
            {request.description && (
              <div className="text-gray-700 whitespace-pre-wrap text-base leading-relaxed">
                {request.description}
              </div>
            )}

            {/* Period */}
            <div className="flex items-center space-x-2 text-lg">
              <Calendar className="h-5 w-5 text-gray-500" />
              <span className="font-medium text-gray-900">
                {formatPeriod(request.period_start, request.period_end)}
              </span>
            </div>

            {/* Info Row - Priority, Category, Status */}
            <div className="flex items-center space-x-4">
              {getPriorityBadge(request.priority)}
              <Badge variant="outline" className="text-base px-3 py-1">
                {request.category}
              </Badge>
              {getStatusBadge(computeStatus())}
            </div>

            {/* Assignment Info */}
            {assignedUser && (
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Assigned to <span className="font-medium">{assignedUser.name}</span> ({assignedUser.email})
                </span>
              </div>
            )}

            {/* Upload Zone - Always Visible */}
            {request.allow_file_upload && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-medium text-lg mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Upload Documents
                  </h3>
                  <FileUploadZone 
                    requestId={requestId!} 
                    onUploadComplete={handleUploadComplete}
                  />
                </CardContent>
              </Card>
            )}

            {/* Text Response Box */}
            {request.allow_text_response && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-medium text-lg mb-4">Text Response</h3>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Enter your response here..."
                      value={textResponse}
                      onChange={(e) => setTextResponse(e.target.value)}
                      className="min-h-[120px] resize-none"
                    />
                    <Button 
                      onClick={handleTextResponseSubmit}
                      disabled={submitting || !textResponse.trim()}
                      className="flex items-center space-x-2"
                    >
                      <Send className="h-4 w-4" />
                      <span>{response ? 'Update Response' : 'Submit Response'}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Uploaded Documents */}
            {documents.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-medium text-lg mb-4">Uploaded Documents</h3>
                  <DocumentList 
                    documents={documents} 
                    onDocumentUpdate={loadRequestDetails}
                  />
                </CardContent>
              </Card>
            )}

            {/* Due Date and Timestamps */}
            <div className="text-sm text-gray-500 pt-4 border-t space-y-1">
              {request.due_date && (
                <div className={`${
                  new Date(request.due_date) < new Date() ? 'text-red-600 font-medium' : ''
                }`}>
                  Due: {new Date(request.due_date).toLocaleDateString()}
                  {new Date(request.due_date) < new Date() && (
                    <span className="text-red-600 ml-2">(Overdue)</span>
                  )}
                </div>
              )}
              <div>Created: {new Date(request.created_at).toLocaleString()}</div>
              <div>Last Updated: {new Date(request.updated_at).toLocaleString()}</div>
            </div>
          </div>
        ) : (
          <div className="p-6">Request not found</div>
        )}
      </DialogContent>
    </Dialog>
  );
};
