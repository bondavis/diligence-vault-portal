
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type DiligenceRequest = Database['public']['Tables']['diligence_requests']['Row'] & {
  document_count?: number;
  has_response?: boolean;
  computed_status?: string;
};

type RequestPriority = Database['public']['Enums']['request_priority'];
type RequestCategory = Database['public']['Enums']['request_category'];

interface RequestsHeaderProps {
  requests: DiligenceRequest[];
  filteredRequests: DiligenceRequest[];
  showFilters: boolean;
  activeFilters: {
    priority?: RequestPriority;
    category?: RequestCategory;
    status?: string;
  };
  onToggleFilters: () => void;
}

export const RequestsHeader = ({
  requests,
  filteredRequests,
  showFilters,
  activeFilters,
  onToggleFilters
}: RequestsHeaderProps) => {
  return (
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
  );
};
