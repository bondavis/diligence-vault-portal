
import { useState } from 'react';
import { CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RequestFilters } from '../RequestFilters';
import { BulkRequestActions } from '../BulkRequestActions';
import { RequestCard } from './RequestCard';
import { EnhancedRequestCard } from './EnhancedRequestCard';
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
  return (
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
            <div className="flex items-center space-x-2 p-4 border-b bg-gray-50 mb-4">
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
        <div className="text-center py-8 text-gray-500">
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
    </CardContent>
  );
};
