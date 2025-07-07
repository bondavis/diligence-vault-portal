import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronUp, Search, Filter, Grid, List } from 'lucide-react';
import { EnhancedRequestsHeader } from './EnhancedRequestsHeader';
import { RequestsListContent } from './RequestsListContent';
import { Database } from '@/integrations/supabase/types';

type DiligenceRequest = Database['public']['Tables']['diligence_requests']['Row'] & {
  document_count?: number;
  has_response?: boolean;
  computed_status?: string;
};

type RequestPriority = Database['public']['Enums']['request_priority'];
type RequestCategory = Database['public']['Enums']['request_category'];

interface CollapsibleRequestsSectionProps {
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
  selectedRequests: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectRequest: (requestId: string, checked: boolean) => void;
  onDeleteRequest: (requestId: string) => void;
}

export const CollapsibleRequestsSection = ({
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
  isAdmin = false,
  selectedRequests,
  onSelectAll,
  onSelectRequest,
  onDeleteRequest
}: CollapsibleRequestsSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('requestsSection-expanded');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Save expanded state to localStorage
  useEffect(() => {
    localStorage.setItem('requestsSection-expanded', JSON.stringify(isExpanded));
  }, [isExpanded]);

  // Filter requests based on search term
  const searchFilteredRequests = filteredRequests.filter(request =>
    request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Card className="overflow-hidden">
      {/* Always visible header */}
      <div 
        className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50/50 transition-colors border-b"
        onClick={toggleExpanded}
      >
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-auto"
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </Button>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Diligence Requests</h2>
            <p className="text-sm text-gray-600">
              {searchFilteredRequests.length} of {requests.length} requests
              {searchTerm && ` matching "${searchTerm}"`}
              {Object.keys(activeFilters).some(key => activeFilters[key as keyof typeof activeFilters]) && 
                ' (filtered)'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Quick stats */}
          <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600 mr-4">
            <span className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>{getRequestCounts().byStatus['Accepted'] || 0} Complete</span>
            </span>
            <span className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span>{getRequestCounts().byStatus['Review Pending'] || 0} In Progress</span>
            </span>
            <span className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
              <span>{getRequestCounts().byStatus['Incomplete'] || 0} Pending</span>
            </span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFilters();
            }}
            className={showFilters ? 'bg-blue-50 border-blue-200' : ''}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Collapsible content */}
      {isExpanded && (
        <div className="animate-accordion-down">
          {/* Enhanced controls when expanded */}
          <div className="p-6 space-y-4 border-b bg-gray-50/30">
            <div className="flex items-center justify-between space-x-4">
              {/* Search bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search requests by title, description, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* View mode toggle */}
              <div className="flex items-center space-x-1 bg-white rounded-lg border p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="px-2 py-1 h-auto"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="px-2 py-1 h-auto"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Quick filter chips */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={!activeFilters.priority && !activeFilters.category && !activeFilters.status ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFilterChange({})}
                className="h-8"
              >
                All Requests
              </Button>
              <Button
                variant={activeFilters.status === 'Incomplete' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFilterChange({ status: 'Incomplete' })}
                className="h-8"
              >
                Pending ({getRequestCounts().byStatus['Incomplete'] || 0})
              </Button>
              <Button
                variant={activeFilters.status === 'Review Pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFilterChange({ status: 'Review Pending' })}
                className="h-8"
              >
                In Progress ({getRequestCounts().byStatus['Review Pending'] || 0})
              </Button>
              <Button
                variant={activeFilters.priority === 'high' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFilterChange({ priority: 'high' })}
                className="h-8"
              >
                High Priority ({getRequestCounts().high})
              </Button>
            </div>
          </div>

          {/* Content area */}
          <RequestsListContent
            requests={requests}
            filteredRequests={searchFilteredRequests}
            loading={loading}
            showFilters={showFilters}
            activeFilters={activeFilters}
            onFilterChange={onFilterChange}
            onRequestClick={onRequestClick}
            onRequestsUpdated={onRequestsUpdated}
            getRequestCounts={getRequestCounts}
            isAdmin={isAdmin}
            selectedRequests={selectedRequests}
            onSelectAll={onSelectAll}
            onSelectRequest={onSelectRequest}
            onDeleteRequest={onDeleteRequest}
            viewMode={viewMode}
          />
        </div>
      )}
    </Card>
  );
};