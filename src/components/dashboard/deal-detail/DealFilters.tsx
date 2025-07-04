
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, X } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type RequestPriority = Database['public']['Enums']['request_priority'];
type RequestCategory = Database['public']['Enums']['request_category'];

interface RequestCounts {
  total: number;
  high: number;
  medium: number;
  low: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
}

interface DealFiltersProps {
  showFilters: boolean;
  activeFilters: {
    priority?: RequestPriority;
    category?: RequestCategory;
    status?: string;
  };
  requestCounts: RequestCounts;
  onToggleFilters: () => void;
  onFilterChange: (filters: {
    priority?: RequestPriority;
    category?: RequestCategory;
    status?: string;
  }) => void;
}

export const DealFilters = ({
  showFilters,
  activeFilters,
  requestCounts,
  onToggleFilters,
  onFilterChange
}: DealFiltersProps) => {
  const clearFilter = (filterType: keyof typeof activeFilters) => {
    onFilterChange({ ...activeFilters, [filterType]: undefined });
  };

  const clearAllFilters = () => {
    onFilterChange({});
  };

  const hasActiveFilters = Object.values(activeFilters).some(Boolean);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleFilters}
            className="flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </Button>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-gray-500 hover:text-gray-700"
            >
              Clear all
            </Button>
          )}
        </div>
        <div className="text-sm text-gray-500">
          {requestCounts.total} total requests
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.priority && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>Priority: {activeFilters.priority}</span>
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => clearFilter('priority')}
              />
            </Badge>
          )}
          {activeFilters.category && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>Category: {activeFilters.category}</span>
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => clearFilter('category')}
              />
            </Badge>
          )}
          {activeFilters.status && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>Status: {activeFilters.status}</span>
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => clearFilter('status')}
              />
            </Badge>
          )}
        </div>
      )}

      {/* Filter Options */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Filter Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Priority Filters */}
            <div>
              <h4 className="text-sm font-medium mb-2">Priority</h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={activeFilters.priority === 'high' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onFilterChange({ ...activeFilters, priority: 'high' })}
                >
                  High ({requestCounts.high})
                </Button>
                <Button
                  variant={activeFilters.priority === 'medium' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onFilterChange({ ...activeFilters, priority: 'medium' })}
                >
                  Medium ({requestCounts.medium})
                </Button>
                <Button
                  variant={activeFilters.priority === 'low' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onFilterChange({ ...activeFilters, priority: 'low' })}
                >
                  Low ({requestCounts.low})
                </Button>
              </div>
            </div>

            {/* Category Filters */}
            <div>
              <h4 className="text-sm font-medium mb-2">Category</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(requestCounts.byCategory).map(([category, count]) => (
                  <Button
                    key={category}
                    variant={activeFilters.category === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onFilterChange({ ...activeFilters, category: category as RequestCategory })}
                  >
                    {category} ({count})
                  </Button>
                ))}
              </div>
            </div>

            {/* Status Filters */}
            <div>
              <h4 className="text-sm font-medium mb-2">Status</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(requestCounts.byStatus).map(([status, count]) => (
                  <Button
                    key={status}
                    variant={activeFilters.status === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onFilterChange({ ...activeFilters, status })}
                  >
                    {status} ({count})
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
