
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileUploadZone } from '../upload/FileUploadZone';
import { DocumentList } from './DocumentList';
import { Clock, AlertCircle, CheckCircle, User, Calendar, FileText, Upload } from 'lucide-react';

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
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'submitted': return <AlertCircle className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
          <DialogTitle>Request Details</DialogTitle>
          <DialogDescription>
            Complete information and document management for this diligence request
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="p-6">Loading request details...</div>
        ) : request ? (
          <div className="space-y-6">
            {/* Request Header */}
            <div>
              <h3 className="text-lg font-semibold mb-2">{request.title}</h3>
              <div className="flex items-center space-x-4 mb-4">
                <Badge variant="outline">{request.category}</Badge>
                <Badge className={getPriorityColor(request.priority)}>
                  {request.priority.toUpperCase()}
                </Badge>
                <Badge className={getStatusColor(request.status)}>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(request.status)}
                    <span className="capitalize">{request.status}</span>
                  </div>
                </Badge>
              </div>
            </div>

            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details" className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Details</span>
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center space-x-2">
                  <Upload className="h-4 w-4" />
                  <span>Documents ({documents.length})</span>
                </TabsTrigger>
                <TabsTrigger value="response" className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Response</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                {/* Description */}
                {request.description && (
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{request.description}</p>
                  </div>
                )}

                {/* Assignment and Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Assigned To
                    </h4>
                    {assignedUser ? (
                      <div>
                        <div className="font-medium">{assignedUser.name}</div>
                        <div className="text-sm text-gray-500">{assignedUser.email}</div>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-amber-600">
                        Unassigned
                      </Badge>
                    )}
                  </div>

                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Period
                    </h4>
                    <div className="text-sm">
                      {formatPeriod(request.period_start, request.period_end)}
                    </div>
                  </div>
                </div>

                {/* Due Date */}
                {request.due_date && (
                  <div>
                    <h4 className="font-medium mb-2">Due Date</h4>
                    <div className={`${
                      new Date(request.due_date) < new Date() ? 'text-red-600 font-medium' : ''
                    }`}>
                      {new Date(request.due_date).toLocaleDateString()}
                      {new Date(request.due_date) < new Date() && (
                        <span className="text-red-600 text-sm ml-2">(Overdue)</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Upload/Response Options */}
                <div>
                  <h4 className="font-medium mb-2">Response Options</h4>
                  <div className="flex space-x-4">
                    <Badge variant={request.allow_file_upload ? "default" : "secondary"}>
                      File Upload: {request.allow_file_upload ? 'Enabled' : 'Disabled'}
                    </Badge>
                    <Badge variant={request.allow_text_response ? "default" : "secondary"}>
                      Text Response: {request.allow_text_response ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="text-sm text-gray-500 pt-4 border-t">
                  <div>Created: {new Date(request.created_at).toLocaleString()}</div>
                  <div>Last Updated: {new Date(request.updated_at).toLocaleString()}</div>
                </div>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                <div className="space-y-4">
                  {request.allow_file_upload && (
                    <div>
                      <h4 className="font-medium mb-4">Upload Documents</h4>
                      <FileUploadZone 
                        requestId={requestId!} 
                        onUploadComplete={handleUploadComplete}
                      />
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-medium mb-4">Uploaded Documents</h4>
                    <DocumentList 
                      documents={documents} 
                      onDocumentUpdate={loadRequestDetails}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="response" className="space-y-4">
                {response ? (
                  <div>
                    <h4 className="font-medium mb-2">User Response</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 mb-2">
                        Submitted on {new Date(response.submitted_at).toLocaleString()}
                      </div>
                      {response.text_response && (
                        <div>
                          <h5 className="font-medium mb-1">Text Response:</h5>
                          <p className="whitespace-pre-wrap">{response.text_response}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No response submitted yet
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="p-6">Request not found</div>
        )}
      </DialogContent>
    </Dialog>
  );
};
