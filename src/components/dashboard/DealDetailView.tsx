
import { useState } from 'react';
import { RequestDetailModal } from './RequestDetailModal';
import { DealHeader } from './DealHeader';
import { DealProgressCard } from './DealProgressCard';
import { DealActions } from './DealActions';
import { RequestsList } from './RequestsList';
import { templateService } from '@/services/templateService';
import { Database } from '@/integrations/supabase/types';
import { RecentActivity } from './RecentActivity';
import { useDealRequests } from './deal-detail/useDealRequests';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type DiligenceRequest = Database['public']['Tables']['diligence_requests']['Row'] & {
  document_count?: number;
  has_response?: boolean;
  computed_status?: string;
};

type RequestPriority = Database['public']['Enums']['request_priority'];
type RequestCategory = Database['public']['Enums']['request_category'];

interface Deal {
  id: string;
  name: string;
  company_name: string;
  project_name: string;
  target_close_date: string | null;
  created_at: string;
  request_count?: number;
  completed_count?: number;
}

interface DealDetailViewProps {
  deal: Deal;
  onBack: () => void;
  onRequestUpdate?: () => void;
}

export const DealDetailView = ({ deal, onBack, onRequestUpdate }: DealDetailViewProps) => {
  const { requests, categoryProgress, loading, loadDealRequests, getRequestCounts } = useDealRequests(deal.id);
  const [filteredRequests, setFilteredRequests] = useState<DiligenceRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<DiligenceRequest | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{
    priority?: RequestPriority;
    category?: RequestCategory;
    status?: string;
  }>({});
  const { toast } = useToast();

  // Apply filters whenever requests or activeFilters change
  useState(() => {
    let filtered = [...requests];

    if (activeFilters.priority) {
      filtered = filtered.filter(req => req.priority === activeFilters.priority);
    }

    if (activeFilters.category) {
      filtered = filtered.filter(req => req.category === activeFilters.category);
    }

    if (activeFilters.status) {
      filtered = filtered.filter(req => req.computed_status === activeFilters.status);
    }

    setFilteredRequests(filtered);
  });

  const handleLoadTemplate = async () => {
    try {
      setLoadingTemplate(true);
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Not authenticated');

      await templateService.applyTemplateToDeal(deal.id, user.data.user.id);
      
      toast({
        title: "Success",
        description: "Template requests loaded successfully",
      });

      loadDealRequests();
    } catch (error) {
      console.error('Error loading template:', error);
      toast({
        title: "Error",
        description: "Failed to load template requests",
        variant: "destructive",
      });
    } finally {
      setLoadingTemplate(false);
    }
  };

  const completedRequests = requests.filter(r => r.computed_status === 'Accepted').length;
  const totalRequests = requests.length;
  const overallCompletionPercentage = totalRequests > 0 ? Math.round((completedRequests / totalRequests) * 100) : 0;

  const handleRequestsUpdated = () => {
    loadDealRequests();
    if (onRequestUpdate) {
      onRequestUpdate();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        <DealHeader 
          deal={deal} 
          overallCompletionPercentage={overallCompletionPercentage} 
          onBack={onBack} 
        />

        <DealProgressCard categoryProgress={categoryProgress} />

        <DealActions 
          onLoadTemplate={handleLoadTemplate} 
          loadingTemplate={loadingTemplate} 
        />

        <RequestsList
          requests={requests}
          filteredRequests={filteredRequests}
          loading={loading}
          showFilters={showFilters}
          activeFilters={activeFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
          onFilterChange={setActiveFilters}
          onRequestClick={setSelectedRequest}
          onRequestsUpdated={handleRequestsUpdated}
          getRequestCounts={getRequestCounts}
          isAdmin={true}
        />
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-1">
        <RecentActivity dealId={deal.id} />
      </div>

      <RequestDetailModal
        request={selectedRequest}
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onUpdate={loadDealRequests}
        isAdmin={true}
      />
    </div>
  );
};
