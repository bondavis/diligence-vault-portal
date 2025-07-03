
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Filter, FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { RequestFilters } from './RequestFilters';
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
  getRequestCounts: () => {
    total: number;
    high: number;
    medium: number;
    low: number;
    byCategory: Record<string, number>;
    byStatus: Record<string, number>;
  };
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
  getRequestCounts
}: RequestsListProps) => {
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
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onRequestClick(request)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
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
                  <div className="flex flex-col items-end space-y-2">
                    {getPriorityBadge(request.priority)}
                    <Badge className={getStatusColor(request.computed_status || 'pending')}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(request.computed_status || 'pending')}
                        <span>{request.computed_status}</span>
                      </div>
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
