
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Building, CheckCircle, Clock, AlertTriangle, FileText } from 'lucide-react';
import { User } from '@/pages/Index';
import { DiligenceRequestList } from '@/components/requests/DiligenceRequestList';
import { QuestionnaireCard } from './QuestionnaireCard';
import { SellerQuestionnaire } from '@/components/questionnaire/SellerQuestionnaire';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SellerDashboardProps {
  user: User;
}

interface DealInfo {
  id: string;
  name: string;
  company_name: string;
  project_name: string;
  target_close_date: string | null;
  overallProgress: number;
}

export const SellerDashboard = ({ user }: SellerDashboardProps) => {
  const [dealInfo, setDealInfo] = useState<DealInfo | null>(null);
  const [taskStats, setTaskStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0
  });
  const [loading, setLoading] = useState(true);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [questionnaireStatus, setQuestionnaireStatus] = useState<{
    exists: boolean;
    completed: boolean;
    progress: number;
  }>({ exists: false, completed: false, progress: 0 });
  const { toast } = useToast();

  useEffect(() => {
    loadDealInfo();
    if (user.dealId) {
      loadQuestionnaireStatus();
    }
  }, [user.dealId]);

  const loadQuestionnaireStatus = async () => {
    if (!user.dealId) return;
    
    try {
      const userAuth = await supabase.auth.getUser();
      if (!userAuth.data.user) return;

      // Check if there's a session for this deal
      const { data: session, error: sessionError } = await supabase
        .from('questionnaire_sessions')
        .select('*')
        .eq('deal_id', user.dealId)
        .eq('user_id', userAuth.data.user.id)
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
          .eq('deal_id', user.dealId)
          .eq('user_id', userAuth.data.user.id);

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

  useEffect(() => {
    loadDealInfo();
  }, [user.dealId]);

  const loadDealInfo = async () => {
    if (!user.dealId) {
      setLoading(false);
      return;
    }

    try {
      // Load deal information
      const { data: dealData, error: dealError } = await supabase
        .from('deals')
        .select('*')
        .eq('id', user.dealId)
        .single();

      if (dealError) throw dealError;

      // Load request statistics
      const { data: requestsData, error: requestsError } = await supabase
        .from('diligence_requests')
        .select('status, due_date')
        .eq('deal_id', user.dealId);

      if (requestsError) throw requestsError;

      const total = requestsData?.length || 0;
      const completed = requestsData?.filter(r => r.status === 'approved').length || 0;
      const pending = requestsData?.filter(r => r.status === 'pending').length || 0;
      const overdue = requestsData?.filter(r => {
        if (!r.due_date) return false;
        return new Date(r.due_date) < new Date() && r.status !== 'approved';
      }).length || 0;

      const overallProgress = total > 0 ? Math.round((completed / total) * 100) : 0;

      setDealInfo({
        ...dealData,
        overallProgress
      });

      setTaskStats({
        total,
        completed,
        pending,
        overdue
      });

    } catch (error) {
      console.error('Error loading deal info:', error);
      toast({
        title: "Error",
        description: "Failed to load deal information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
  if (showQuestionnaire && user.dealId) {
    return (
      <SellerQuestionnaire
        dealId={user.dealId}
        dealName={dealInfo?.name}
        onComplete={handleQuestionnaireComplete}
        onBack={() => setShowQuestionnaire(false)}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bb-red"></div>
      </div>
    );
  }

  if (!dealInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>No Deal Assigned</span>
          </CardTitle>
          <CardDescription>
            You are not currently assigned to any deals. Please contact your administrator.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Deal Header */}
      <Card className="bg-card border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-foreground">{dealInfo.name}</CardTitle>
              <CardDescription className="text-muted-foreground">
                {dealInfo.company_name} • {dealInfo.project_name}
                {dealInfo.target_close_date && (
                  <> • Target Close: {new Date(dealInfo.target_close_date).toLocaleDateString()}</>
                )}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-foreground">{dealInfo.overallProgress}%</div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </div>
          </div>
          <div className="mt-4">
            <Progress value={dealInfo.overallProgress} className="bg-muted" />
          </div>
        </CardHeader>
      </Card>

      {/* Task Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-bb-red">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-bb-dark-gray">Total Requests</CardTitle>
            <FileText className="h-4 w-4 text-bb-red" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-bb-dark-gray">{taskStats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-bb-dark-gray">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-bb-dark-gray">Pending</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{taskStats.pending}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-bb-dark-gray">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{taskStats.overdue}</div>
          </CardContent>
        </Card>
      </div>

      {/* Post-LOI Questionnaire */}
      <QuestionnaireCard 
        status={questionnaireStatus}
        onStart={() => setShowQuestionnaire(true)}
        loading={loading}
      />

      {/* Diligence Requests */}
      <DiligenceRequestList user={user} />
    </div>
  );
};
