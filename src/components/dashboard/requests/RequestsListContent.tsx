
import { useState } from 'react';
import { CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Workflow, Layers } from 'lucide-react';
import { RequestFilters } from '../RequestFilters';
import { BulkRequestActions } from '../BulkRequestActions';
import { RequestCard } from './RequestCard';
import { EnhancedRequestCard } from './EnhancedRequestCard';
import { StageBasedRequestsList } from './StageBasedRequestsList';
import { Database } from '@/integrations/supabase/types';

type DiligenceRequest = Database['public']['Tables']['diligence_requests']['Row'] & {
  document_count?: number;
  has_response?: boolean;
  computed_status?: string;
};

type RequestPriority = Database['public']['Enums']['request_priority'];
type RequestCategory = Database['public']['Enums']['request_category'];

interface RequestsListContentProps {
  requests: DiligenceRequest[];
  filteredRequests: DiligenceRequest[];
  loading: boolean;
  showFilters: boolean;
  activeFilters: {
    priority?: RequestPriority;
    category?: RequestCategory;
    status?: string;
  };
  onFilterChange: (filters: {
    priority?: RequestPriority;
    category?: RequestCategory;
    status?: string;
  }) => void;
  onRequestClick: (request: DiligenceRequest) => void;
  onRequestsUpdated: () => void;
  onBulkRequestsDeleted?: (deletedRequestIds: string[]) => void;
  getRequestCounts: () => {
    total: number;
    high: number;
    medium: number;
    low: number;
    byCategory: Record<string, number>;
    byStatus: Record<string, number>;
  };
  isAdmin?: boolean;
  selectedRequests: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectRequest: (requestId: string, checked: boolean) => void;
  onDeleteRequest: (requestId: string) => void;
  viewMode?: 'grid' | 'list';
}

export const RequestsListContent = ({
  requests,
  filteredRequests,
  loading,
  showFilters,
  activeFilters,
  onFilterChange,
  onRequestClick,
  onRequestsUpdated,
  onBulkRequestsDeleted,
  getRequestCounts,
  isAdmin = false,
  selectedRequests,
  onSelectAll,
  onSelectRequest,
  onDeleteRequest,
  viewMode = 'grid'
}: RequestsListContentProps) => {
  const [showStageView, setShowStageView] = useState(() => {
    const saved = localStorage.getItem('showStageView');
    return saved !== null ? JSON.parse(saved) : false;
  });

  // Save stage view preference
  const toggleStageView = () => {
    const newValue = !showStageView;
    setShowStageView(newValue);
    localStorage.setItem('showStageView', JSON.stringify(newValue));
  };

  return (
    <CardContent>
      {showFilters && (
        <div className="mb-6 p-4 border rounded-lg bg-muted/50">
          <RequestFilters
            activeFilters={activeFilters}
            onFilterChange={onFilterChange}
            requestCounts={getRequestCounts()}
          />
        </div>
      )}

      {/* View Mode Toggle */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant={showStageView ? "outline" : "default"}
            size="sm"
            onClick={() => setShowStageView(false)}
            className="flex items-center space-x-2"
          >
            <Layers className="h-4 w-4" />
            <span>Category View</span>
          </Button>
          <Button
            variant={showStageView ? "default" : "outline"}
            size="sm"
            onClick={() => setShowStageView(true)}
            className="flex items-center space-x-2"
          >
            <Workflow className="h-4 w-4" />
            <span>Stage View</span>
          </Button>
        </div>
      </div>

      {/* Conditional rendering based on view mode */}
      {showStageView ? (
        <StageBasedRequestsList
          requests={requests}
          filteredRequests={filteredRequests}
          loading={loading}
          onRequestClick={onRequestClick}
          onRequestsUpdated={onRequestsUpdated}
          onDeleteRequest={onDeleteRequest}
          isAdmin={isAdmin}
          selectedRequests={selectedRequests}
          onSelectRequest={onSelectRequest}
          viewMode={viewMode}
        />
      ) : (
        <>
          {isAdmin && (
            <>
              <BulkRequestActions
                selectedRequests={selectedRequests}
                onRequestsDeleted={() => {
                  if (onBulkRequestsDeleted) {
                    onBulkRequestsDeleted(selectedRequests);
                  } else {
                    onRequestsUpdated();
                  }
                }}
                onSelectionClear={() => onSelectAll(false)}
              />
              
              {filteredRequests.length > 0 && (
                <div className="flex items-center space-x-2 p-4 border-b bg-muted/50 mb-4">
                  <Checkbox
                    checked={selectedRequests.length === filteredRequests.length && filteredRequests.length > 0}
                    onCheckedChange={onSelectAll}
                  />
                  <span className="text-sm font-medium">Select All</span>
                </div>
              )}
            </>
          )}

          {loading ? (
            <div className="text-center py-8">Loading requests...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {requests.length === 0 
                ? "No diligence requests found for this deal."
                : "No requests match the current filters."
              }
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-6' : 'space-y-4'}>
              {filteredRequests.map((request) => 
                viewMode === 'grid' ? (
                  <EnhancedRequestCard
                    key={request.id}
                    request={request}
                    isSelected={selectedRequests.includes(request.id)}
                    isAdmin={isAdmin}
                    onSelectRequest={onSelectRequest}
                    onRequestClick={onRequestClick}
                    onDeleteRequest={onDeleteRequest}
                  />
                ) : (
                  <RequestCard
                    key={request.id}
                    request={request}
                    isSelected={selectedRequests.includes(request.id)}
                    isAdmin={isAdmin}
                    onSelectRequest={onSelectRequest}
                    onRequestClick={onRequestClick}
                    onDeleteRequest={onDeleteRequest}
                  />
                )
              )}
            </div>
          )}
        </>
      )}
    </CardContent>
  );
};
