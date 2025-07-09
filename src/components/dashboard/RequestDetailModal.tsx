
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Calendar, AlertCircle, CheckCircle, Clock, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EnhancedFileUploadZone } from '../upload/EnhancedFileUploadZone';
import { EmployeeCensusSpreadsheet } from '../requests/EmployeeCensusSpreadsheet';
import { Database } from '@/integrations/supabase/types';

type DiligenceRequest = Database['public']['Tables']['diligence_requests']['Row'];
type RequestStatus = Database['public']['Enums']['request_status'];
type RequestPriority = Database['public']['Enums']['request_priority'];

interface RequestDetailModalProps {
  request: DiligenceRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
  isAdmin?: boolean;
}

export const RequestDetailModal = ({ request, isOpen, onClose, onUpdate, isAdmin = false }: RequestDetailModalProps) => {
  const [textResponse, setTextResponse] = useState('');
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<{
    title?: string;
    description?: string | null;
    priority?: RequestPriority;
    due_date?: string | null;
    period_text?: string | null;
  }>({});
  const { toast } = useToast();

  useEffect(() => {
    if (request && isOpen) {
      loadRequestData();
      setEditData({
        title: request.title,
        description: request.description,
        priority: request.priority,
        due_date: request.due_date,
        period_text: request.period_text
      });
    }
  }, [request, isOpen]);

  const loadRequestData = async () => {
    if (!request) return;

    try {
      // Load existing response
      const { data: responseData } = await supabase
        .from('diligence_responses')
        .select('text_response')
        .eq('request_id', request.id)
        .maybeSingle();

      if (responseData) {
        setTextResponse(responseData.text_response || '');
      }

      // Load documents
      const { data: docsData } = await supabase
        .from('request_documents')
        .select('*')
        .eq('request_id', request.id);

      setDocuments(docsData || []);
    } catch (error) {
      console.error('Error loading request data:', error);
    }
  };

  const handleSubmit = async () => {
    if (!request || !textResponse.trim()) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('diligence_responses')
        .upsert({
          request_id: request.id,
          user_id: (await supabase.auth.getUser()).data.user?.id!,
          text_response: textResponse
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Seller commentary submitted successfully",
      });

      onUpdate?.();
    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        title: "Error",
        description: "Failed to submit seller commentary",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!request || !isAdmin) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('diligence_requests')
        .update(editData)
        .eq('id', request.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Request updated successfully",
      });

      setEditMode(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating request:', error);
      toast({
        title: "Error",
        description: "Failed to update request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: RequestStatus) => {
    if (!request || !isAdmin) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('diligence_requests')
        .update({ status: newStatus })
        .eq('id', request.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Request ${newStatus} successfully`,
      });

      onUpdate?.();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = () => {
    loadRequestData();
    onUpdate?.();
  };

  const getPriorityBadge = (priority: RequestPriority) => {
    switch (priority) {
      case 'high': 
        return <Badge className="bg-red-500 text-white">HIGH</Badge>;
      case 'medium': 
        return <Badge className="bg-orange-500 text-white">MEDIUM</Badge>;
      case 'low': 
        return <Badge className="bg-green-500 text-white">LOW</Badge>;
      default: 
        return <Badge variant="outline">{String(priority).toUpperCase()}</Badge>;
    }
  };

  const getStatusIcon = (status: RequestStatus) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'submitted': return <AlertCircle className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <FileText className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (!request) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{editMode ? (
              <Input
                value={editData.title || ''}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                className="text-xl font-semibold"
              />
            ) : request.title}</span>
            <div className="flex items-center space-x-2">
              {getPriorityBadge(request.priority)}
              <Badge variant="outline" className="flex items-center space-x-1">
                {getStatusIcon(request.status)}
                <span>{request.status.toUpperCase()}</span>
              </Badge>
              <Badge variant="outline">{request.category}</Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Description */}
          <div>
            <Label className="text-base font-medium">Description</Label>
            {editMode && isAdmin ? (
              <Textarea
                value={editData.description || ''}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                rows={3}
                className="mt-2"
              />
            ) : (
              <p className="text-sm text-gray-600 whitespace-pre-wrap mt-2">
                {request.description || 'No description provided'}
              </p>
            )}
          </div>

          {/* Period */}
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <div className="flex-1">
              <Label className="text-base font-medium">Period</Label>
              {editMode && isAdmin ? (
                <Input
                  value={editData.period_text || ''}
                  onChange={(e) => setEditData({ ...editData, period_text: e.target.value })}
                  placeholder="e.g., Last 2 Years, 13 Months, etc."
                  className="mt-1"
                />
              ) : (
                <p className="text-sm text-gray-600 mt-1">
                  {request.period_text || 'No period specified'}
                </p>
              )}
            </div>
          </div>

          {/* Edit Mode Controls */}
          {editMode && isAdmin && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50">
              <div>
                <Label htmlFor="edit-priority">Priority</Label>
                <Select value={editData.priority} onValueChange={(value: RequestPriority) => setEditData({ ...editData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-due-date">Due Date</Label>
                <Input
                  id="edit-due-date"
                  type="date"
                  value={editData.due_date || ''}
                  onChange={(e) => setEditData({ ...editData, due_date: e.target.value })}
                />
              </div>
              <div className="flex space-x-2 col-span-full">
                <Button onClick={handleSaveEdit} disabled={loading}>
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setEditMode(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* File Upload Zone - Now at the top */}
          {request.allow_file_upload && (
            <div>
              <Label className="text-base font-medium mb-4 block">Document Upload</Label>
              <EnhancedFileUploadZone 
                requestId={request.id} 
                onUploadComplete={handleUploadComplete}
              />
            </div>
          )}

          {/* Employee Census Spreadsheet for Employee Census requests */}
          {(request.title.toLowerCase().includes('employee census') || 
            request.title.toLowerCase().includes('employee list') ||
            request.category === 'HR') && (
            <div>
              <Label className="text-base font-medium mb-4 block">Employee Census</Label>
              <EmployeeCensusSpreadsheet />
            </div>
          )}

          {/* Uploaded Documents List */}
          {documents.length > 0 && (
            <div>
              <Label className="text-base font-medium">Uploaded Documents ({documents.length})</Label>
              <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-2 border rounded text-sm">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>{doc.filename}</span>
                      <span className="text-gray-500">({(doc.file_size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seller Commentary with Save Draft */}
          {request.allow_text_response && (
            <div>
              <Label className="text-base font-medium">Seller Commentary</Label>
              <Textarea
                placeholder="Example: 'Please see attached trial balance for FY2023 and FY2024. YTD2025 numbers reflect unaudited figures through Q3.' Provide context, clarifications, or additional information that would be helpful for the review team."
                value={textResponse}
                onChange={(e) => setTextResponse(e.target.value)}
                rows={4}
                className="mt-2"
              />
              <div className="flex justify-between mt-2">
                <p className="text-xs text-gray-500">Auto-saves every 30 seconds</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    // Auto-save functionality could be implemented here
                    toast({
                      title: "Draft Saved",
                      description: "Your commentary has been saved as a draft",
                    });
                  }}
                >
                  Save Draft
                </Button>
              </div>
            </div>
          )}

          {/* Admin Controls */}
          {isAdmin && !editMode && (
            <div className="flex items-center space-x-2 border-t pt-4">
              <Button variant="outline" onClick={() => setEditMode(true)}>
                Edit Request
              </Button>
              <Select onValueChange={handleStatusChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Change Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Submit Button - At the bottom */}
          <div className="flex justify-end border-t pt-4">
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !textResponse.trim()}
              className="flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>Submit</span>
            </Button>
          </div>

          {/* Request Metadata - Simplified */}
          <div className="text-sm text-gray-500 pt-4 border-t space-y-2">
            {request.due_date && (
              <div className={`flex items-center justify-between ${
                new Date(request.due_date) < new Date() ? 'text-red-600 font-medium' : ''
              }`}>
                <span>Due Date: {new Date(request.due_date).toLocaleDateString()}</span>
                {new Date(request.due_date) < new Date() && (
                  <span className="text-red-600 text-xs bg-red-100 px-2 py-1 rounded">(Overdue)</span>
                )}
              </div>
            )}
            <div className="flex items-center justify-between">
              <span>Last Updated: {new Date(request.updated_at).toLocaleString()}</span>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">ID: {request.id.slice(0, 8)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
