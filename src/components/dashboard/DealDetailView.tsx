import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RequestDetailModal } from './RequestDetailModal';
import { DealHeader } from './DealHeader';
import { DealProgressCard } from './DealProgressCard';
import { DealActions } from './DealActions';
import { RequestsList } from './RequestsList';
import { templateService } from '@/services/templateService';
import { Database } from '@/integrations/supabase/types';
import { RecentActivity } from './RecentActivity';

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

interface CategoryProgress {
  category: string;
  total: number;
  completed: number;
  percentage: number;
}

interface DealDetailViewProps {
  deal: Deal;
  onBack: () => void;
  onRequestUpdate?: () => void;
}

export const DealDetailView = ({ deal, onBack, onRequestUpdate }: DealDetailViewProps) => {
  const [requests, setRequests] = useState<DiligenceRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<DiligenceRequest[]>([]);
  const [categoryProgress, setCategoryProgress] = useState<CategoryProgress[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<DiligenceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{
    priority?: RequestPriority;
    category?: RequestCategory;
    status?: string;
  }>({});
  const { toast } = useToast();

  useEffect(() => {
    loadDealRequests();
  }, [deal.id]);

  useEffect(() => {
    applyFilters();
  }, [requests, activeFilters]);

  const computeRequestStatus = (request: DiligenceRequest) => {
    const hasDocuments = (request.document_count || 0) > 0;
    const hasResponse = request.has_response;
    
    if (request.status === 'approved') return 'Accepted';
    if (hasDocuments || hasResponse) return 'Review Pending';
    return 'Incomplete';
  };

  const applyFilters = () => {
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
  };

  const getRequestCounts = () => {
    const total = requests.length;
    const high = requests.filter(r => r.priority === 'high').length;
    const medium = requests.filter(r => r.priority === 'medium').length;
    const low = requests.filter(r => r.priority === 'low').length;

    const byCategory: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    requests.forEach(req => {
      byCategory[req.category] = (byCategory[req.category] || 0) + 1;
      byStatus[req.computed_status || 'pending'] = (byStatus[req.computed_status || 'pending'] || 0) + 1;
    });

    return { total, high, medium, low, byCategory, byStatus };
  };

  const loadDealRequests = async () => {
    try {
      setLoading(true);
      
      const { data: requestsData, error: requestsError } = await supabase
        .from('diligence_requests')
        .select('*')
        .eq('deal_id', deal.id)
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      // Get document counts and response status for each request
      const requestsWithStatus = await Promise.all(
        (requestsData || []).map(async (request) => {
          const { count: docCount } = await supabase
            .from('request_documents')
            .select('*', { count: 'exact', head: true })
            .eq('request_id', request.id);

          const { data: responseData } = await supabase
            .from('diligence_responses')
            .select('id')
            .eq('request_id', request.id)
            .maybeSingle();

          const enrichedRequest = {
            ...request,
            document_count: docCount || 0,
            has_response: !!responseData
          };

          return {
            ...enrichedRequest,
            computed_status: computeRequestStatus(enrichedRequest)
          };
        })
      );

      setRequests(requestsWithStatus);
      calculateCategoryProgress(requestsWithStatus);
    } catch (error) {
      console.error('Error loading deal requests:', error);
      toast({
        title: "Error",
        description: "Failed to load diligence requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateCategoryProgress = (requests: DiligenceRequest[]) => {
    const categoryMap = new Map<string, { total: number; completed: number }>();
    
    requests.forEach(request => {
      const category = request.category;
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { total: 0, completed: 0 });
      }
      
      const categoryStats = categoryMap.get(category)!;
      categoryStats.total++;
      
      if (request.computed_status === 'Accepted') {
        categoryStats.completed++;
      }
    });

    const progress = Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category,
      total: stats.total,
      completed: stats.completed,
      percentage: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
    }));

    setCategoryProgress(progress);
  };

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
