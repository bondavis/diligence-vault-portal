import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, Search, Grid, List, BarChart3 } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type DiligenceRequest = Database['public']['Tables']['diligence_requests']['Row'] & {
  document_count?: number;
  has_response?: boolean;
  computed_status?: string;
};

type RequestPriority = Database['public']['Enums']['request_priority'];
type RequestCategory = Database['public']['Enums']['request_category'];

interface EnhancedRequestsHeaderProps {
  requests: DiligenceRequest[];
  filteredRequests: DiligenceRequest[];
  showFilters: boolean;
  activeFilters: {
    priority?: RequestPriority;
    category?: RequestCategory;
    status?: string;
  };
  onToggleFilters: () => void;
  getRequestCounts: () => {
    total: number;
    high: number;
    medium: number;
    low: number;
    byCategory: Record<string, number>;
    byStatus: Record<string, number>;
  };
}

export const EnhancedRequestsHeader = ({
  requests,
  filteredRequests,
  showFilters,
  activeFilters,
  onToggleFilters,
  getRequestCounts
}: EnhancedRequestsHeaderProps) => {
  const counts = getRequestCounts();
  const completionPercentage = requests.length > 0 
    ? Math.round(((counts.byStatus['Accepted'] || 0) / requests.length) * 100)
    : 0;

  return (
    <CardHeader className="pb-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <CardTitle className="text-2xl">Diligence Requests</CardTitle>
            <Badge 
              variant="outline" 
              className="bg-blue-50 text-blue-700 border-blue-200 font-medium"
            >
              {completionPercentage}% Complete
            </Badge>
          </div>
          
          <CardDescription className="text-base">
            {filteredRequests.length} of {requests.length} requests
            {Object.keys(activeFilters).some(key => activeFilters[key as keyof typeof activeFilters]) && 
              ' (filtered)'}
          </CardDescription>

          {/* Quick stats bar */}
          <div className="flex items-center space-x-6 pt-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium text-gray-600">
                {counts.byStatus['Accepted'] || 0} Complete
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm font-medium text-gray-600">
                {counts.byStatus['Review Pending'] || 0} In Progress
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span className="text-sm font-medium text-gray-600">
                {counts.byStatus['Incomplete'] || 0} Pending
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm font-medium text-gray-600">
                {counts.high} High Priority
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleFilters}
            className={showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {Object.keys(activeFilters).some(key => activeFilters[key as keyof typeof activeFilters]) && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                {Object.values(activeFilters).filter(Boolean).length}
              </Badge>
            )}
          </Button>
        </div>
      </div>
    </CardHeader>
  );
};