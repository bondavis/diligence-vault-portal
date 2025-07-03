
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Upload, Download, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DiligenceRequest {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  due_date: string | null;
  created_at: string;
  allow_file_upload: boolean;
  allow_text_response: boolean;
  period_text: string | null;
}

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
  const [editData, setEditData] = useState<Partial<DiligenceRequest>>({});
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

  const handleTextSubmit = async () => {
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
        description: "Response submitted successfully",
      });

      onUpdate?.();
    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        title: "Error",
        description: "Failed to submit response",
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

  const handleStatusChange = async (newStatus: string) => {
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

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': 
        return <Badge className="bg-red-500 text-white">HIGH</Badge>;
      case 'medium': 
        return <Badge className="bg-orange-500 text-white">MEDIUM</Badge>;
      case 'low': 
        return <Badge className="bg-green-500 text-white">LOW</Badge>;
      default: 
        return <Badge variant="outline">{priority.toUpperCase()}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{editMode ? 'Edit Request' : request.title}</span>
            <div className="flex items-center space-x-2">
              {getPriorityBadge(request.priority)}
              <Badge variant="outline" className="flex items-center space-x-1">
                {getStatusIcon(request.status)}
                <span>{request.status.toUpperCase()}</span>
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Request Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <p className="text-sm text-gray-600">{request.category}</p>
            </div>
            <div>
              <Label>Created</Label>
              <p className="text-sm text-gray-600">
                {new Date(request.created_at).toLocaleDateString()}
              </p>
            </div>
            {request.due_date && (
              <div>
                <Label>Due Date</Label>
                <p className="text-sm text-gray-600">
                  {new Date(request.due_date).toLocaleDateString()}
                </p>
              </div>
            )}
            {request.period_text && (
              <div>
                <Label>Period</Label>
                <p className="text-sm text-gray-600">{request.period_text}</p>
              </div>
            )}
          </div>

          {/* Edit Mode */}
          {editMode && isAdmin ? (
            <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
              <h3 className="font-medium">Edit Request Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={editData.title || ''}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Select value={editData.priority} onValueChange={(value) => setEditData({ ...editData, priority: value as any })}>
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
                <div>
                  <Label htmlFor="edit-period">Period</Label>
                  <Input
                    id="edit-period"
                    value={editData.period_text || ''}
                    onChange={(e) => setEditData({ ...editData, period_text: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editData.description || ''}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleSaveEdit} disabled={loading}>
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setEditMode(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <Label>Description</Label>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {request.description || 'No description provided'}
              </p>
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

          {/* Text Response */}
          {request.allow_text_response && (
            <div className="space-y-2">
              <Label htmlFor="text-response">Text Response</Label>
              <Textarea
                id="text-response"
                placeholder="Enter your response..."
                value={textResponse}
                onChange={(e) => setTextResponse(e.target.value)}
                rows={4}
              />
              <Button onClick={handleTextSubmit} disabled={loading || !textResponse.trim()}>
                Submit Response
              </Button>
            </div>
          )}

          {/* File Upload (placeholder for now) */}
          {request.allow_file_upload && (
            <div className="space-y-2">
              <Label>File Upload</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-500">File upload functionality coming soon</p>
              </div>
            </div>
          )}

          {/* Documents List */}
          {documents.length > 0 && (
            <div className="space-y-2">
              <Label>Uploaded Documents</Label>
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">{doc.filename}</span>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
