
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter, FileText, AlertCircle, CheckCircle, Clock, Trash2, AlertTriangle } from 'lucide-react';
import { RequestFilters } from './RequestFilters';
import { BulkRequestActions } from './BulkRequestActions';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Database } from '@/integrations/supabase/types';

type DiligenceRequest = Database['public']['Tables']['diligence_requests']['Row'] & {
  document_count?: number;
  has_response?: boolean;
  computed_status?: string;
};

type RequestPriority = Database['public']['Enums']['request_priority'];
type RequestCategory = Database['public']['Enums']['request_category'];

interface RequestsListProps {
  requests: DiligenceRequest[];
  filteredRequests: DiligenceRequest[];
  loading: boolean;
  showFilters: boolean;
  activeFilters: {
    priority?: RequestPriority;
    category?: RequestCategory;
    status?: string;
  };
  onToggleFilters: () => void;
  onFilterChange: (filters: {
    priority?: RequestPriority;
    category?: RequestCategory;
    status?: string;
  }) => void;
  onRequestClick: (request: DiligenceRequest) => void;
  onRequestsUpdated: () => void;
  getRequestCounts: () => {
    total: number;
    high: number;
    medium: number;
    low: number;
    byCategory: Record<string, number>;
    byStatus: Record<string, number>;
  };
  isAdmin?: boolean;
}

export const RequestsList = ({
  requests,
  filteredRequests,
  loading,
  showFilters,
  activeFilters,
  onToggleFilters,
  onFilterChange,
  onRequestClick,
  onRequestsUpdated,
  getRequestCounts,
  isAdmin = false
}: RequestsListProps) => {
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);
  const [isDeletingRequest, setIsDeletingRequest] = useState(false);
  const { toast } = useToast();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPriorityBadge = (priority: RequestPriority) => {
    switch (priority) {
      case 'high': 
        return <Badge className="bg-red-500 text-white hover:bg-red-600">HIGH</Badge>;
      case 'medium': 
        return <Badge className="bg-orange-500 text-white hover:bg-orange-600">MEDIUM</Badge>;
      case 'low': 
        return <Badge className="bg-green-500 text-white hover:bg-green-600">LOW</Badge>;
      default: 
        return <Badge variant="outline">{String(priority).toUpperCase()}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Incomplete': return <FileText className="h-4 w-4" />;
      case 'Review Pending': return <AlertCircle className="h-4 w-4" />;
      case 'Accepted': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Incomplete': return 'bg-gray-100 text-gray-800';
      case 'Review Pending': return 'bg-blue-100 text-blue-800';
      case 'Accepted': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRequests(filteredRequests.map(r => r.id));
    } else {
      setSelectedRequests([]);
    }
  };

  const handleSelectRequest = (requestId: string, checked: boolean) => {
    if (checked) {
      setSelectedRequests(prev => [...prev, requestId]);
    } else {
      setSelectedRequests(prev => prev.filter(id => id !== requestId));
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    try {
      setIsDeletingRequest(true);

      // Delete documents first
      const { error: documentsError } = await supabase
        .from('request_documents')
        .delete()
        .eq('request_id', requestId);

      if (documentsError) throw documentsError;

      // Delete responses
      const { error: responsesError } = await supabase
        .from('diligence_responses')
        .delete()
        .eq('request_id', requestId);

      if (responsesError) throw responsesError;

      // Delete the request
      const { error: requestError } = await supabase
        .from('diligence_requests')
        .delete()
        .eq('id', requestId);

      if (requestError) throw requestError;

      toast({
        title: "Success",
        description: "Request deleted successfully",
      });

      onRequestsUpdated();
      setRequestToDelete(null);
    } catch (error) {
      console.error('Error deleting request:', error);
      toast({
        title: "Error",
        description: "Failed to delete request",
        variant: "destructive",
      });
    } finally {
      setIsDeletingRequest(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Diligence Requests</CardTitle>
            <CardDescription>
              {filteredRequests.length} of {requests.length} requests
              {Object.keys(activeFilters).some(key => activeFilters[key as keyof typeof activeFilters]) && 
                ' (filtered)'}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleFilters}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showFilters && (
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <RequestFilters
              activeFilters={activeFilters}
              onFilterChange={onFilterChange}
              requestCounts={getRequestCounts()}
            />
          </div>
        )}

        {isAdmin && (
          <>
            <BulkRequestActions
              selectedRequests={selectedRequests}
              onRequestsDeleted={onRequestsUpdated}
              onSelectionClear={() => setSelectedRequests([])}
            />
            
            {filteredRequests.length > 0 && (
              <div className="flex items-center space-x-2 p-4 border-b bg-gray-50">
                <Checkbox
                  checked={selectedRequests.length === filteredRequests.length && filteredRequests.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm font-medium">Select All</span>
              </div>
            )}
          </>
        )}

        {loading ? (
          <div className="text-center py-8">Loading requests...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {requests.length === 0 
              ? "No diligence requests found for this deal."
              : "No requests match the current filters."
            }
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div 
                key={request.id} 
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {isAdmin && (
                      <Checkbox
                        checked={selectedRequests.includes(request.id)}
                        onCheckedChange={(checked) => handleSelectRequest(request.id, checked as boolean)}
                        className="mt-1"
                      />
                    )}
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => onRequestClick(request)}
                    >
                      <h4 className="font-medium text-lg mb-1">{request.title}</h4>
                      {request.description && (
                        <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                        <span>Category: {request.category}</span>
                        <span>Created: {formatDate(request.created_at)}</span>
                        {request.due_date && (
                          <span>Due: {formatDate(request.due_date)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex flex-col items-end space-y-2">
                      {getPriorityBadge(request.priority)}
                      <Badge className={getStatusColor(request.computed_status || 'pending')}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(request.computed_status || 'pending')}
                          <span>{request.computed_status}</span>
                        </div>
                      </Badge>
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRequestToDelete(request.id);
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Individual Delete Confirmation */}
      <AlertDialog open={!!requestToDelete} onOpenChange={() => setRequestToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>Delete Request</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this request? This will also delete all associated documents and responses. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => requestToDelete && handleDeleteRequest(requestToDelete)}
              disabled={isDeletingRequest}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingRequest ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
