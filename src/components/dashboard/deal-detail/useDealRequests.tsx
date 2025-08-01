
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type DiligenceRequest = Database['public']['Tables']['diligence_requests']['Row'] & {
  document_count?: number;
  has_response?: boolean;
  computed_status?: string;
};

interface CategoryProgress {
  category: string;
  total: number;
  completed: number;
  percentage: number;
}

export const useDealRequests = (dealId: string) => {
  const [requests, setRequests] = useState<DiligenceRequest[]>([]);
  const [categoryProgress, setCategoryProgress] = useState<CategoryProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Function to remove deleted requests from local state
  const removeRequestsFromState = (deletedRequestIds: string[]) => {
    setRequests(prev => {
      const filtered = prev.filter(req => !deletedRequestIds.includes(req.id));
      calculateCategoryProgress(filtered);
      return filtered;
    });
  };

  const computeRequestStatus = (request: DiligenceRequest) => {
    const hasDocuments = (request.document_count || 0) > 0;
    const hasResponse = request.has_response;
    
    if (request.status === 'approved') return 'Accepted';
    if (hasDocuments || hasResponse) return 'Review Pending';
    return 'Incomplete';
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

  const loadDealRequests = async () => {
    try {
      setLoading(true);
      console.log('Loading deal requests for deal:', dealId);
      
      const { data: requestsData, error: requestsError } = await supabase
        .from('diligence_requests')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      console.log('Found requests:', requestsData?.length || 0);

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

  useEffect(() => {
    loadDealRequests();
  }, [dealId]);

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

  return {
    requests,
    categoryProgress,
    loading,
    loadDealRequests,
    getRequestCounts,
    removeRequestsFromState
  };
};
