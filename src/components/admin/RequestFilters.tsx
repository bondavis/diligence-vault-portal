
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface RequestFiltersProps {
  filters: {
    category: string;
    priority: string;
    status: string;
    assigned: string;
  };
  onFiltersChange: (filters: any) => void;
}

const categories = [
  'Financial', 'Legal', 'Operations', 'HR', 'IT', 'Environmental', 'Commercial', 'Other'
];

const priorities = ['high', 'medium', 'low'];
const statuses = ['pending', 'submitted', 'approved', 'rejected'];

export const RequestFilters = ({ filters, onFiltersChange }: RequestFiltersProps) => {
  const clearFilters = () => {
    onFiltersChange({
      category: 'all',
      priority: 'all',
      status: 'all',
      assigned: 'all'
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '' && value !== 'all');

  return (
    <div className="flex items-center space-x-4">
      <Select
        value={filters.category || 'all'}
        onValueChange={(value) => onFiltersChange({ ...filters, category: value === 'all' ? '' : value })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map(category => (
            <SelectItem key={category} value={category}>{category}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.priority || 'all'}
        onValueChange={(value) => onFiltersChange({ ...filters, priority: value === 'all' ? '' : value })}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="All Priorities" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          {priorities.map(priority => (
            <SelectItem key={priority} value={priority}>
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.status || 'all'}
        onValueChange={(value) => onFiltersChange({ ...filters, status: value === 'all' ? '' : value })}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          {statuses.map(status => (
            <SelectItem key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.assigned || 'all'}
        onValueChange={(value) => onFiltersChange({ ...filters, assigned: value === 'all' ? '' : value })}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="All Assignments" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Assignments</SelectItem>
          <SelectItem value="assigned">Assigned</SelectItem>
          <SelectItem value="unassigned">Unassigned</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-2" />
          Clear
        </Button>
      )}
    </div>
  );
};
