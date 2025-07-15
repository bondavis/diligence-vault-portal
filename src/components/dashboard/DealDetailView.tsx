
import { useState, useEffect } from 'react';
import { RequestDetailModal } from './RequestDetailModal';
import { ConsolidatedProgressTracker } from './ConsolidatedProgressTracker';
import { DealActions } from './DealActions';
import { RequestsList } from './RequestsList';
import { QuestionnaireCard } from './QuestionnaireCard';
import { EnhancedSellerQuestionnaire } from '@/components/questionnaire/EnhancedSellerQuestionnaire';
import { templateService } from '@/services/templateService';
import { Database } from '@/integrations/supabase/types';
import { RecentActivity } from './RecentActivity';
import { FAQWidget } from './FAQWidget';
import { useDealRequests } from './deal-detail/useDealRequests';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { auditLogger } from '@/utils/auditLogger';
import { DashboardErrorBoundary } from '@/components/error/ErrorBoundary';

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
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [questionnaireStatus, setQuestionnaireStatus] = useState<{
    exists: boolean;
    completed: boolean;
    progress: number;
  }>({ exists: false, completed: false, progress: 0 });
  const [activeFilters, setActiveFilters] = useState<{
    priority?: RequestPriority;
    category?: RequestCategory;
    status?: string;
  }>({});
  const { toast } = useToast();

  // Load questionnaire status and log deal access
  useEffect(() => {
    loadQuestionnaireStatus();
    // Log deal access for audit
    auditLogger.logDealAccess(deal.id, deal.name);
  }, [deal.id, deal.name]);

  const loadQuestionnaireStatus = async () => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      // Check if there's a session for this deal
      const { data: session, error: sessionError } = await supabase
        .from('questionnaire_sessions')
        .select('*')
        .eq('deal_id', deal.id)
        .eq('user_id', user.data.user.id)
        .single();

      if (sessionError && sessionError.code !== 'PGRST116') {
        console.error('Error loading questionnaire status:', sessionError);
        return;
      }

      if (session) {
        // Get total question count
        const { data: questions, error: questionsError } = await supabase
          .from('questionnaire_questions')
          .select('id')
          .eq('is_active', true);

        if (questionsError) throw questionsError;

        // Get answered questions count
        const { data: responses, error: responsesError } = await supabase
          .from('questionnaire_responses')
          .select('id')
          .eq('deal_id', deal.id)
          .eq('user_id', user.data.user.id);

        if (responsesError) throw responsesError;

        const totalQuestions = questions?.length || 0;
        const answeredQuestions = responses?.length || 0;
        const progress = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

        setQuestionnaireStatus({
          exists: true,
          completed: session.is_completed,
          progress: progress,
        });
      } else {
        setQuestionnaireStatus({
          exists: false,
          completed: false,
          progress: 0,
        });
      }
    } catch (error) {
      console.error('Error loading questionnaire status:', error);
    }
  };

  // Apply filters whenever requests or activeFilters change
  useEffect(() => {
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

    // Apply priority-based sorting: Financial high → HR high → Legal high → others
    filtered.sort((a, b) => {
      // Create priority scoring
      const getPriorityScore = (request: DiligenceRequest) => {
        const { priority, category } = request;
        
        // Highest priority: Financial + High
        if (category === 'Financial' && priority === 'high') return 1;
        // Second: HR + High  
        if (category === 'HR' && priority === 'high') return 2;
        // Third: Legal + High
        if (category === 'Legal' && priority === 'high') return 3;
        
        // Then other high priority requests
        if (priority === 'high') return 4;
        // Then medium priority requests
        if (priority === 'medium') return 5;
        // Finally low priority requests
        return 6;
      };

      const scoreA = getPriorityScore(a);
      const scoreB = getPriorityScore(b);
      
      // Sort by priority score, then by creation date (newest first)
      if (scoreA !== scoreB) {
        return scoreA - scoreB;
      }
      
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    setFilteredRequests(filtered);
  }, [requests, activeFilters]);

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

  const handleQuestionnaireComplete = () => {
    setShowQuestionnaire(false);
    loadQuestionnaireStatus();
    toast({
      title: "Questionnaire Complete!",
      description: "Your Post-LOI questionnaire has been submitted successfully",
    });
  };

  // If showing questionnaire, render it full screen
  if (showQuestionnaire) {
    return (
      <EnhancedSellerQuestionnaire
        dealId={deal.id}
        dealName={deal.name}
        onComplete={handleQuestionnaireComplete}
        onBack={() => setShowQuestionnaire(false)}
      />
    );
  }

  return (
    <DashboardErrorBoundary>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <DashboardErrorBoundary>
            <ConsolidatedProgressTracker 
              deal={deal} 
              overallCompletionPercentage={overallCompletionPercentage} 
              categoryProgress={categoryProgress}
              onBack={onBack}
              onCategoryClick={(category) => {
                setActiveFilters({ category: category as RequestCategory, status: 'pending' });
                setShowFilters(true);
              }}
            />
          </DashboardErrorBoundary>

          <DashboardErrorBoundary>
            <QuestionnaireCard 
              status={questionnaireStatus}
              onStart={() => setShowQuestionnaire(true)}
              loading={loading}
            />
          </DashboardErrorBoundary>

          <DashboardErrorBoundary>
            <DealActions 
              onLoadTemplate={handleLoadTemplate} 
              loadingTemplate={loadingTemplate} 
            />
          </DashboardErrorBoundary>

          <DashboardErrorBoundary>
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
          </DashboardErrorBoundary>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <DashboardErrorBoundary>
            <RecentActivity dealId={deal.id} />
          </DashboardErrorBoundary>
          <DashboardErrorBoundary>
            <FAQWidget />
          </DashboardErrorBoundary>
        </div>

        <RequestDetailModal
          request={selectedRequest}
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onUpdate={loadDealRequests}
          isAdmin={true}
        />
      </div>
    </DashboardErrorBoundary>
  );
};
