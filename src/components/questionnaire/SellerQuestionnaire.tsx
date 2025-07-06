import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Save, CheckCircle } from 'lucide-react';
import { QuestionRenderer } from './QuestionRenderer';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type QuestionnaireQuestion = Database['public']['Tables']['questionnaire_questions']['Row'];
type QuestionnaireSession = Database['public']['Tables']['questionnaire_sessions']['Row'];

interface SellerQuestionnaireProps {
  dealId: string;
  dealName?: string;
  onComplete?: () => void;
  onBack?: () => void;
}

export const SellerQuestionnaire = ({ 
  dealId, 
  dealName, 
  onComplete, 
  onBack 
}: SellerQuestionnaireProps) => {
  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>([]);
  const [session, setSession] = useState<QuestionnaireSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Handle Service Mix questions specially - group them together
  const serviceMixQuestions = questions.filter(q => q.category === 'Service Mix');
  const otherQuestions = questions.filter(q => q.category !== 'Service Mix');
  
  // Create question groups - Service Mix as one group, others individually
  const questionGroups = [
    ...otherQuestions.map(q => [q]),
    ...(serviceMixQuestions.length > 0 ? [serviceMixQuestions] : [])
  ];

  const currentGroup = questionGroups[currentQuestionIndex] || [];
  const totalGroups = questionGroups.length;
  const progressPercentage = totalGroups > 0 ? Math.round(((currentQuestionIndex + 1) / totalGroups) * 100) : 0;
  const isServiceMixGroup = currentGroup.length > 1 && currentGroup[0]?.category === 'Service Mix';

  useEffect(() => {
    loadQuestionnaire();
  }, [dealId]);

  const loadQuestionnaire = async () => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Not authenticated');

      // Load active questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questionnaire_questions')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('sort_order', { ascending: true });

      if (questionsError) throw questionsError;

      // Load or create session
      const { data: sessionData, error: sessionError } = await supabase
        .from('questionnaire_sessions')
        .select('*')
        .eq('deal_id', dealId)
        .eq('user_id', user.data.user.id)
        .single();

      if (sessionError && sessionError.code !== 'PGRST116') {
        throw sessionError;
      }

      let currentSession = sessionData;

      if (!currentSession) {
        // Create new session
        const { data: newSession, error: createError } = await supabase
          .from('questionnaire_sessions')
          .insert({
            deal_id: dealId,
            user_id: user.data.user.id,
            current_question_id: questionsData?.[0]?.id || null,
          })
          .select()
          .single();

        if (createError) throw createError;
        currentSession = newSession;
      }

      // Load existing responses
      const { data: responsesData, error: responsesError } = await supabase
        .from('questionnaire_responses')
        .select('*')
        .eq('deal_id', dealId)
        .eq('user_id', user.data.user.id);

      if (responsesError) throw responsesError;

      // Convert responses to state format
      const responseMap: Record<string, any> = {};
      responsesData?.forEach(response => {
        responseMap[response.question_id] = response.response_value;
      });

      setQuestions(questionsData || []);
      setSession(currentSession);
      setResponses(responseMap);

      // Find current question index based on session
      if (currentSession?.current_question_id && questionsData) {
        const questionIndex = questionsData.findIndex(q => q.id === currentSession.current_question_id);
        if (questionIndex >= 0) {
          // Find the group index that contains this question
          const allQuestions = [...otherQuestions, ...serviceMixQuestions];
          const globalIndex = allQuestions.findIndex(q => q.id === currentSession.current_question_id);
          
          if (globalIndex >= 0) {
            // Calculate which group this question belongs to
            let groupIndex = 0;
            let questionsCount = 0;
            
            for (let i = 0; i < otherQuestions.length; i++) {
              if (questionsCount === globalIndex) {
                groupIndex = i;
                break;
              }
              questionsCount++;
            }
            
            if (globalIndex >= otherQuestions.length) {
              groupIndex = otherQuestions.length; // Service Mix group
            }
            
            setCurrentQuestionIndex(Math.min(groupIndex, questionGroups.length - 1));
          }
        }
      }
    } catch (error) {
      console.error('Error loading questionnaire:', error);
      toast({
        title: "Error",
        description: "Failed to load questionnaire",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses({
      ...responses,
      [questionId]: value,
    });
  };

  const saveProgress = async (questionId?: string) => {
    if (!session) return;

    try {
      setSaving(true);
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Not authenticated');

      // Save all current responses
      const responsesToSave = Object.entries(responses).map(([qId, value]) => ({
        deal_id: dealId,
        question_id: qId,
        user_id: user.data.user.id,
        response_value: String(value),
      }));

      if (responsesToSave.length > 0) {
        const { error: responseError } = await supabase
          .from('questionnaire_responses')
          .upsert(responsesToSave, { onConflict: 'deal_id,question_id,user_id' });

        if (responseError) throw responseError;
      }

      // Update session
      const { error: sessionError } = await supabase
        .from('questionnaire_sessions')
        .update({
          current_question_id: questionId || session.current_question_id,
          last_updated: new Date().toISOString(),
        })
        .eq('id', session.id);

      if (sessionError) throw sessionError;

      toast({
        title: "Progress Saved",
        description: "Your responses have been saved successfully",
      });
    } catch (error) {
      console.error('Error saving progress:', error);
      toast({
        title: "Error",
        description: "Failed to save progress",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    return currentGroup.every(question => {
      if (!question.is_required) return true;
      const response = responses[question.id];
      return response !== undefined && response !== null && response !== '';
    });
  };

  const goToNext = async () => {
    if (currentQuestionIndex < totalGroups - 1) {
      // Save progress before moving to next
      const nextQuestionId = questionGroups[currentQuestionIndex + 1]?.[0]?.id;
      await saveProgress(nextQuestionId);
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const completeQuestionnaire = async () => {
    if (!session) return;

    try {
      setSaving(true);
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Not authenticated');

      // Save final responses
      await saveProgress();

      // Mark session as completed
      const { error: sessionError } = await supabase
        .from('questionnaire_sessions')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', session.id);

      if (sessionError) throw sessionError;

      toast({
        title: "Questionnaire Complete!",
        description: "Your Post-LOI questionnaire has been submitted successfully",
      });

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error completing questionnaire:', error);
      toast({
        title: "Error",
        description: "Failed to complete questionnaire",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bb-light-gray p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center">
                <div className="text-gray-500">Loading questionnaire...</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (session?.is_completed) {
    return (
      <div className="min-h-screen bg-bb-light-gray p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Questionnaire Complete</h2>
              <p className="text-gray-600 mb-6">
                You have successfully completed the Post-LOI questionnaire for {dealName || 'this deal'}.
              </p>
              {onBack && (
                <Button onClick={onBack} variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Deals
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bb-light-gray p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Post-LOI Questionnaire</CardTitle>
                <p className="text-gray-600 mt-1">
                  {dealName && `Deal: ${dealName}`}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => saveProgress()}
                  disabled={saving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Progress'}
                </Button>
                {onBack && (
                  <Button
                    variant="ghost"
                    onClick={onBack}
                    className="text-gray-600 hover:text-gray-700"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Progress */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Progress: {currentQuestionIndex + 1} of {totalGroups}
              </span>
              <span className="text-sm text-gray-500">
                {progressPercentage}% Complete
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </CardContent>
        </Card>

        {/* Question(s) */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {isServiceMixGroup ? 'Service Mix Distribution' : currentGroup[0]?.category}
                </CardTitle>
                {isServiceMixGroup && (
                  <p className="text-sm text-gray-600 mt-1">
                    Please provide the percentage breakdown for your service mix. All percentages should total 100%.
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentGroup.map((question, index) => (
              <div key={question.id} className={isServiceMixGroup && index > 0 ? 'border-t pt-6' : ''}>
                <QuestionRenderer
                  question={question}
                  value={responses[question.id]}
                  onChange={(value) => handleResponseChange(question.id, value)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Navigation */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={goToPrevious}
                disabled={currentQuestionIndex === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <div className="text-sm text-gray-500">
                {currentQuestionIndex + 1} of {totalGroups}
              </div>

              {currentQuestionIndex === totalGroups - 1 ? (
                <Button
                  onClick={completeQuestionnaire}
                  disabled={!canProceed() || saving}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {saving ? 'Submitting...' : 'Complete Questionnaire'}
                </Button>
              ) : (
                <Button
                  onClick={goToNext}
                  disabled={!canProceed() || saving}
                  className="bg-bb-red hover:bg-red-700"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>

            {!canProceed() && (
              <p className="text-sm text-orange-600 mt-2 text-center">
                Please answer all required questions to continue
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};