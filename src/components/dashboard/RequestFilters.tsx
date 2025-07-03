
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database } from '@/integrations/supabase/types';

type RequestPriority = Database['public']['Enums']['request_priority'];
type RequestCategory = Database['public']['Enums']['request_category'];

interface RequestFiltersProps {
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
  requestCounts: {
    total: number;
    high: number;
    medium: number;
    low: number;
    byCategory: Record<string, number>;
    byStatus: Record<string, number>;
  };
}

export const RequestFilters = ({ activeFilters, onFilterChange, requestCounts }: RequestFiltersProps) => {
  const priorities: RequestPriority[] = ['high', 'medium', 'low'];
  const categories: RequestCategory[] = ['Financial', 'Legal', 'Operations', 'HR', 'IT', 'Environmental', 'Commercial', 'Other'];
  const statuses = ['Incomplete', 'Review Pending', 'Accepted'];

  const clearFilters = () => {
    onFilterChange({});
  };

  const hasActiveFilters = activeFilters.priority || activeFilters.category || activeFilters.status;

  return (
    <div className="space-y-4">
      {/* Priority Filters */}
      <div>
        <h4 className="text-sm font-medium mb-2">Priority</h4>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={!activeFilters.priority ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange({ ...activeFilters, priority: undefined })}
          >
            All <Badge variant="secondary" className="ml-1">{requestCounts.total}</Badge>
          </Button>
          {priorities.map((priority) => (
            <Button
              key={priority}
              variant={activeFilters.priority === priority ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange({ ...activeFilters, priority })}
              className={priority === 'high' ? 'border-red-500' : priority === 'medium' ? 'border-orange-500' : 'border-green-500'}
            >
              {priority.toUpperCase()} <Badge variant="secondary" className="ml-1">{requestCounts[priority]}</Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Category Filters */}
      <div>
        <h4 className="text-sm font-medium mb-2">Category</h4>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={!activeFilters.category ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange({ ...activeFilters, category: undefined })}
          >
            All <Badge variant="secondary" className="ml-1">{requestCounts.total}</Badge>
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeFilters.category === category ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange({ ...activeFilters, category })}
            >
              {category} <Badge variant="secondary" className="ml-1">{requestCounts.byCategory[category] || 0}</Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Status Filters */}
      <div>
        <h4 className="text-sm font-medium mb-2">Status</h4>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={!activeFilters.status ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange({ ...activeFilters, status: undefined })}
          >
            All <Badge variant="secondary" className="ml-1">{requestCounts.total}</Badge>
          </Button>
          {statuses.map((status) => (
            <Button
              key={status}
              variant={activeFilters.status === status ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange({ ...activeFilters, status })}
            >
              {status} <Badge variant="secondary" className="ml-1">{requestCounts.byStatus[status] || 0}</Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );
};
