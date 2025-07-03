
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Calendar, Building, FileText, AlertCircle, CheckCircle, Clock, Plus, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RequestDetailModal } from './RequestDetailModal';
import { templateService } from '@/services/templateService';

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

interface DiligenceRequest {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  due_date: string | null;
  created_at: string;
  document_count?: number;
  has_response?: boolean;
  computed_status?: string;
  allow_file_upload: boolean;
  allow_text_response: boolean;
  period_text: string | null;
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
  const [categoryProgress, setCategoryProgress] = useState<CategoryProgress[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<DiligenceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDealRequests();
  }, [deal.id]);

  const computeRequestStatus = (request: DiligenceRequest) => {
    const hasDocuments = (request.document_count || 0) > 0;
    const hasResponse = request.has_response;
    
    if (request.status === 'approved') return 'Accepted';
    if (hasDocuments || hasResponse) return 'Review Pending';
    return 'Incomplete';
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': 
        return <Badge className="bg-red-500 text-white hover:bg-red-600">HIGH</Badge>;
      case 'medium': 
        return <Badge className="bg-orange-500 text-white hover:bg-orange-600">MEDIUM</Badge>;
      case 'low': 
        return <Badge className="bg-green-500 text-white hover:bg-green-600">LOW</Badge>;
      default: 
        return <Badge variant="outline">{priority.toUpperCase()}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Incomplete': return <FileText className="h-4 w-4" />;
      case 'Review Pending': return <AlertCircle className="h-4 w-4" />;
      case 'Accepted': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Incomplete': return 'bg-gray-100 text-gray-800';
      case 'Review Pending': return 'bg-blue-100 text-blue-800';
      case 'Accepted': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const completedRequests = requests.filter(r => r.computed_status === 'Accepted').length;
  const totalRequests = requests.length;
  const overallCompletionPercentage = totalRequests > 0 ? Math.round((completedRequests / totalRequests) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Deals
              </Button>
              <div>
                <CardTitle className="text-2xl">{deal.name}</CardTitle>
                <CardDescription>
                  {deal.company_name} - {deal.project_name}
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-bb-red">{overallCompletionPercentage}%</div>
              <div className="text-sm text-gray-500">Complete</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-gray-500" />
              <div>
                <div className="text-sm font-medium">Company</div>
                <div className="text-sm text-gray-600">{deal.company_name}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <div>
                <div className="text-sm font-medium">Created</div>
                <div className="text-sm text-gray-600">{formatDate(deal.created_at)}</div>
              </div>
            </div>
            {deal.target_close_date && (
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">Target Close</div>
                  <div className="text-sm text-gray-600">{formatDate(deal.target_close_date)}</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Category Progress */}
      {categoryProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Progress by Category</CardTitle>
            <CardDescription>
              Completion status across different request categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryProgress.map((category) => (
                <div key={category.category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{category.category}</span>
                    <span className="text-sm text-gray-500">
                      {category.completed} / {category.total} ({category.percentage}%)
                    </span>
                  </div>
                  <Progress value={category.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Actions */}
      <div className="flex items-center space-x-4">
        <Button onClick={handleLoadTemplate} disabled={loadingTemplate}>
          <Upload className="h-4 w-4 mr-2" />
          {loadingTemplate ? 'Loading...' : 'Load Template Requests'}
        </Button>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Custom Request
        </Button>
      </div>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>Diligence Requests</CardTitle>
          <CardDescription>
            All diligence requests for this deal
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No diligence requests found for this deal.
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div 
                  key={request.id} 
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedRequest(request)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-lg mb-1">{request.title}</h4>
                      {request.description && (
                        <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                        <span>Category: {request.category}</span>
                        <span>Created: {formatDate(request.created_at)}</span>
                        {request.due_date && (
                          <span>Due: {formatDate(request.due_date)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      {getPriorityBadge(request.priority)}
                      <Badge className={getStatusColor(request.computed_status || 'pending')}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(request.computed_status || 'pending')}
                          <span>{request.computed_status}</span>
                        </div>
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Detail Modal */}
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
