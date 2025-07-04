
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { RequestsHeader } from './requests/RequestsHeader';
import { RequestsListContent } from './requests/RequestsListContent';
import { DeleteRequestDialog } from './requests/DeleteRequestDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
      <RequestsHeader
        requests={requests}
        filteredRequests={filteredRequests}
        showFilters={showFilters}
        activeFilters={activeFilters}
        onToggleFilters={onToggleFilters}
      />
      
      <RequestsListContent
        requests={requests}
        filteredRequests={filteredRequests}
        loading={loading}
        showFilters={showFilters}
        activeFilters={activeFilters}
        onFilterChange={onFilterChange}
        onRequestClick={onRequestClick}
        onRequestsUpdated={onRequestsUpdated}
        getRequestCounts={getRequestCounts}
        isAdmin={isAdmin}
        selectedRequests={selectedRequests}
        onSelectAll={handleSelectAll}
        onSelectRequest={handleSelectRequest}
        onDeleteRequest={setRequestToDelete}
      />

      <DeleteRequestDialog
        isOpen={!!requestToDelete}
        isDeleting={isDeletingRequest}
        onClose={() => setRequestToDelete(null)}
        onConfirm={() => requestToDelete && handleDeleteRequest(requestToDelete)}
      />
    </Card>
  );
};
