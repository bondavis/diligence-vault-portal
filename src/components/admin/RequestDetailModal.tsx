
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Clock, AlertCircle, CheckCircle, User, Calendar } from 'lucide-react';

interface RequestDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string | null;
}

export const RequestDetailModal = ({
  open,
  onOpenChange,
  requestId
}: RequestDetailModalProps) => {
  const [request, setRequest] = useState<any>(null);
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && requestId) {
      loadRequestDetails();
    }
  }, [open, requestId]);

  const loadRequestDetails = async () => {
    if (!requestId) return;

    try {
      setLoading(true);
      
      // Load request with assigned user info
      const { data: requestData, error: requestError } = await supabase
        .from('diligence_requests')
        .select(`
          *,
          profiles:assigned_to(name, email)
        `)
        .eq('id', requestId)
        .single();

      if (requestError) throw requestError;

      // Load user response if exists
      const { data: responseData, error: responseError } = await supabase
        .from('diligence_responses')
        .select('*')
        .eq('request_id', requestId)
        .maybeSingle();

      if (responseError && responseError.code !== 'PGRST116') throw responseError;

      setRequest(requestData);
      setResponse(responseData);
    } catch (error) {
      console.error('Error loading request details:', error);
    } finally {
      setLoading(false);
    }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Details</DialogTitle>
          <DialogDescription>
            Complete information about this diligence request
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
                {request.profiles ? (
                  <div>
                    <div className="font-medium">{request.profiles.name}</div>
                    <div className="text-sm text-gray-500">{request.profiles.email}</div>
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
                  Due Date
                </h4>
                {request.due_date ? (
                  <div className={`${
                    new Date(request.due_date) < new Date() ? 'text-red-600 font-medium' : ''
                  }`}>
                    {new Date(request.due_date).toLocaleDateString()}
                    {new Date(request.due_date) < new Date() && (
                      <span className="text-red-600 text-sm ml-2">(Overdue)</span>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400">No due date set</span>
                )}
              </div>
            </div>

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

            {/* User Response */}
            {response && (
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
            )}

            {/* Timestamps */}
            <div className="text-sm text-gray-500 pt-4 border-t">
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
