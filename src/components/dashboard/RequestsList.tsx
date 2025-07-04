
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter, Upload, Eye, MessageSquare, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
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

  const getPriorityBadge = (priority: RequestPriority) => {
    switch (priority) {
      case 'high': 
        return <Badge className="bg-red-100 text-red-800 border-red-200 font-medium px-2 py-1">HIGH</Badge>;
      case 'medium': 
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 font-medium px-2 py-1">MEDIUM</Badge>;
      case 'low': 
        return <Badge className="bg-green-100 text-green-800 border-green-200 font-medium px-2 py-1">LOW</Badge>;
      default: 
        return <Badge variant="outline">{String(priority).toUpperCase()}</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    const categoryColors: Record<string, string> = {
      'Financial': 'bg-blue-100 text-blue-700 border-blue-200',
      'Legal': 'bg-purple-100 text-purple-700 border-purple-200',
      'Operations': 'bg-orange-100 text-orange-700 border-orange-200',
      'HR': 'bg-pink-100 text-pink-700 border-pink-200',
      'IT': 'bg-cyan-100 text-cyan-700 border-cyan-200',
      'Environmental': 'bg-green-100 text-green-700 border-green-200',
      'Commercial': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      'Other': 'bg-gray-100 text-gray-700 border-gray-200'
    };

    return (
      <Badge className={`${categoryColors[category] || categoryColors['Other']} font-medium px-2 py-1`}>
        {category}
      </Badge>
    );
  };

  const getUploadStatusBadge = (request: DiligenceRequest) => {
    const hasDocuments = (request.document_count || 0) > 0;
    const hasResponse = request.has_response;
    
    if (request.computed_status === 'Accepted') {
      return (
        <div className="flex items-center space-x-1 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Uploaded</span>
        </div>
      );
    }
    
    return null;
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
              <div className="flex items-center space-x-2 p-4 border-b bg-gray-50 mb-4">
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
                className="border rounded-lg p-6 hover:bg-gray-50 transition-colors bg-white"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
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
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg text-gray-900">{request.title}</h3>
                        <div className="flex items-center space-x-3">
                          {getPriorityBadge(request.priority)}
                          {getUploadStatusBadge(request)}
                          <Eye className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                      
                      {request.description && (
                        <p className="text-gray-600 mb-4 leading-relaxed">{request.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getCategoryBadge(request.category)}
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          {request.document_count && request.document_count > 0 && (
                            <div className="flex items-center space-x-1 text-gray-500">
                              <MessageSquare className="h-4 w-4" />
                              <span className="text-sm">{request.document_count} {request.document_count === 1 ? 'comment' : 'comments'}</span>
                            </div>
                          )}
                          
                          {request.computed_status !== 'Accepted' && (
                            <Button 
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRequestClick(request);
                              }}
                            >
                              <Upload className="h-4 w-4 mr-1" />
                              Upload
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRequestToDelete(request.id);
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
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
