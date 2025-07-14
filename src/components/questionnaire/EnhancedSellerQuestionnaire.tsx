import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Save, CheckCircle, FileText, BarChart3, Clock, HelpCircle, MessageCircle, Lightbulb, Calendar } from 'lucide-react';
import { QuestionRenderer } from './QuestionRenderer';
import { QuestionnaireSidebar } from './QuestionnaireSidebar';
import { QuestionnaireSummary } from './QuestionnaireSummary';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type QuestionnaireQuestion = Database['public']['Tables']['questionnaire_questions']['Row'];
type QuestionnaireSession = Database['public']['Tables']['questionnaire_sessions']['Row'];
type QuestionnaireCategory = Database['public']['Enums']['questionnaire_category'];

interface EnhancedSellerQuestionnaireProps {
  dealId: string;
  dealName?: string;
  onComplete?: () => void;
  onBack?: () => void;
}

interface QuestionGroup {
  id: string;
  title: string;
  category: QuestionnaireCategory;
  questions: QuestionnaireQuestion[];
  isCompleted: boolean;
  description?: string;
  estimatedTime?: number;
  icon?: string;
}

export const EnhancedSellerQuestionnaire = ({ 
  dealId, 
  dealName, 
  onComplete, 
  onBack 
}: EnhancedSellerQuestionnaireProps) => {
  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>([]);
  const [session, setSession] = useState<QuestionnaireSession | null>(null);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [questionGroups, setQuestionGroups] = useState<QuestionGroup[]>([]);
  const { toast } = useToast();

  // Auto-save timer
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (Object.keys(responses).length > 0) {
        saveProgress();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [responses]);

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

      // Create question groups
      const groups = createQuestionGroups(questionsData || [], responseMap);
      setQuestionGroups(groups);

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

  const getCategoryInfo = (category: string) => {
    const categoryMap = {
      'Business Snapshot': {
        description: 'Core information about your business structure and operations',
        icon: '🏢',
        estimatedTime: 8
      },
      'Key Metrics': {
        description: 'Financial and operational performance indicators',
        icon: '📊',
        estimatedTime: 12
      },
      'Service Mix': {
        description: 'Revenue breakdown by service categories',
        icon: '🎯',
        estimatedTime: 15
      },
      'Sales': {
        description: 'Sales processes, team structure, and customer acquisition',
        icon: '💰',
        estimatedTime: 10
      },
      'HR': {
        description: 'Team composition, compensation, and organizational structure',
        icon: '👥',
        estimatedTime: 8
      },
      'Operational': {
        description: 'Day-to-day operations, processes, and systems',
        icon: '⚙️',
        estimatedTime: 12
      },
      'Customer Experience': {
        description: 'Client relationships, satisfaction, and retention strategies',
        icon: '🤝',
        estimatedTime: 10
      },
      'Marketing': {
        description: 'Marketing strategies, channels, and brand positioning',
        icon: '📈',
        estimatedTime: 8
      },
      'Technology & Systems': {
        description: 'Technology infrastructure, software, and digital capabilities',
        icon: '💻',
        estimatedTime: 10
      },
      'Facilities & Equipment': {
        description: 'Physical assets, locations, and equipment inventory',
        icon: '🏭',
        estimatedTime: 6
      },
      'Compliance/Insurance/Safety': {
        description: 'Regulatory compliance, insurance coverage, and safety protocols',
        icon: '🛡️',
        estimatedTime: 8
      },
      'Deal Specific': {
        description: 'Transaction-specific questions and considerations',
        icon: '📋',
        estimatedTime: 5
      }
    };
    return categoryMap[category] || { description: '', icon: '📄', estimatedTime: 5 };
  };

  const createQuestionGroups = (questionsData: QuestionnaireQuestion[], responseMap: Record<string, any>): QuestionGroup[] => {
    const categoryGroups: Record<string, QuestionnaireQuestion[]> = {};
    
    questionsData.forEach(question => {
      if (!categoryGroups[question.category]) {
        categoryGroups[question.category] = [];
      }
      categoryGroups[question.category].push(question);
    });

    const groups: QuestionGroup[] = [];
    
    Object.entries(categoryGroups).forEach(([category, categoryQuestions]) => {
      const categoryInfo = getCategoryInfo(category);
      
      if (category === 'Service Mix') {
        // Service Mix stays as one group
        groups.push({
          id: `${category}-all`,
          title: 'Service Mix Distribution',
          category: category as QuestionnaireCategory,
          questions: categoryQuestions,
          isCompleted: categoryQuestions.every(q => responseMap[q.id] !== undefined),
          description: categoryInfo.description,
          estimatedTime: categoryInfo.estimatedTime,
          icon: categoryInfo.icon
        });
      } else {
        // Split large categories into smaller groups (3-5 questions each)
        const chunkSize = Math.min(5, Math.max(3, Math.ceil(categoryQuestions.length / Math.ceil(categoryQuestions.length / 4))));
        
        for (let i = 0; i < categoryQuestions.length; i += chunkSize) {
          const chunk = categoryQuestions.slice(i, i + chunkSize);
          const groupNumber = Math.floor(i / chunkSize) + 1;
          const totalGroups = Math.ceil(categoryQuestions.length / chunkSize);
          
          const title = totalGroups > 1 
            ? `${category} (Part ${groupNumber})`
            : category;

          groups.push({
            id: `${category}-${groupNumber}`,
            title,
            category: category as QuestionnaireCategory,
            questions: chunk,
            isCompleted: chunk.every(q => responseMap[q.id] !== undefined),
            description: categoryInfo.description,
            estimatedTime: Math.ceil(categoryInfo.estimatedTime / totalGroups),
            icon: categoryInfo.icon
          });
        }
      }
    });

    return groups;
  };

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value,
    }));
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

      // Update groups completion status
      const updatedGroups = questionGroups.map(group => ({
        ...group,
        isCompleted: group.questions.every(q => responses[q.id] !== undefined)
      }));
      setQuestionGroups(updatedGroups);

    } catch (error) {
      console.error('Error saving progress:', error);
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    const currentGroup = questionGroups[currentGroupIndex];
    if (!currentGroup) return false;
    
    return currentGroup.questions.every(question => {
      if (!question.is_required) return true;
      const response = responses[question.id];
      return response !== undefined && response !== null && response !== '';
    });
  };

  const goToNext = async () => {
    if (currentGroupIndex < questionGroups.length - 1) {
      await saveProgress();
      setCurrentGroupIndex(currentGroupIndex + 1);
    } else {
      setShowSummary(true);
    }
  };

  const goToPrevious = () => {
    if (currentGroupIndex > 0) {
      setCurrentGroupIndex(currentGroupIndex - 1);
    }
  };

  const jumpToGroup = (index: number) => {
    setCurrentGroupIndex(index);
  };

  const completeQuestionnaire = async () => {
    if (!session) return;

    try {
      setSaving(true);
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

  // Calculate overall progress
  const totalQuestions = questions.length;
  const answeredQuestions = Object.keys(responses).length;
  const overallProgress = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
  const completedGroups = questionGroups.filter(g => g.isCompleted).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center">
                <div className="text-muted-foreground">Loading questionnaire...</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (session?.is_completed) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Questionnaire Complete</h2>
              <p className="text-muted-foreground mb-6">
                You have successfully completed the Post-LOI questionnaire for {dealName || 'this deal'}.
              </p>
              <div className="flex justify-center space-x-4">
                <Button variant="outline" onClick={() => setShowSummary(true)}>
                  <FileText className="h-4 w-4 mr-2" />
                  View Summary
                </Button>
                {onBack && (
                  <Button onClick={onBack} variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Deals
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showSummary) {
    return (
      <QuestionnaireSummary
        dealId={dealId}
        dealName={dealName}
        questions={questions}
        responses={responses}
        onBack={() => setShowSummary(false)}
        onComplete={completeQuestionnaire}
        onEdit={(questionId) => {
          // Find group containing this question and navigate to it
          const groupIndex = questionGroups.findIndex(g => 
            g.questions.some(q => q.id === questionId)
          );
          if (groupIndex >= 0) {
            setCurrentGroupIndex(groupIndex);
            setShowSummary(false);
          }
        }}
        isCompleted={session?.is_completed || false}
      />
    );
  }

  const currentGroup = questionGroups[currentGroupIndex];
  if (!currentGroup) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar */}
        <QuestionnaireSidebar
          groups={questionGroups}
          currentGroupIndex={currentGroupIndex}
          onGroupClick={jumpToGroup}
          overallProgress={overallProgress}
          completedGroups={completedGroups}
          totalGroups={questionGroups.length}
        />

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Header */}
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{currentGroup?.icon || '📋'}</div>
                    <div>
                      <CardTitle className="text-2xl text-blue-900">Post-LOI Questionnaire</CardTitle>
                      <p className="text-blue-600 font-medium">
                        {dealName && `Deal: ${dealName}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-blue-700">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>Est. {currentGroup?.estimatedTime || 5} min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Auto-saved every 30 seconds</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => saveProgress()}
                    disabled={saving}
                    className="bg-white hover:bg-blue-50 border-blue-200"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Progress'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSummary(true)}
                    className="bg-white hover:bg-blue-50 border-blue-200"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Summary
                  </Button>
                  {onBack && (
                    <Button
                      variant="ghost"
                      onClick={onBack}
                      className="hover:bg-blue-100"
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
          <Card className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Section {currentGroupIndex + 1} of {questionGroups.length}
                  </Badge>
                  <span className="text-sm font-medium text-green-900">
                    {currentGroup?.title}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span>{overallProgress}% Complete ({answeredQuestions}/{totalQuestions} questions)</span>
                </div>
              </div>
              <Progress value={overallProgress} className="h-3 bg-green-100" />
              <div className="mt-2 text-xs text-green-600">
                {currentGroup?.description}
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          <Card className="mb-6 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{currentGroup.icon}</div>
                  <div>
                    <CardTitle className="text-xl text-gray-900">{currentGroup.title}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{currentGroup.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {currentGroup.questions.length} question{currentGroup.questions.length !== 1 ? 's' : ''}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    ~{currentGroup.estimatedTime} min
                  </Badge>
                </div>
              </div>
              {currentGroup.category === 'Service Mix' && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Lightbulb className="h-4 w-4 text-blue-600" />
                    <p className="text-sm text-blue-800 font-medium">Service Mix Guidelines</p>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    Please provide the percentage breakdown for your service mix. All percentages should total 100%. 
                    Consider your revenue streams from the past 12 months for accuracy.
                  </p>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-8 p-6">
              {currentGroup.questions.map((question, index) => (
                <div key={question.id} className={`${index > 0 ? 'border-t pt-8' : ''} transition-all duration-200`}>
                  <div className="flex items-start space-x-3 mb-4">
                    <Badge variant="secondary" className="mt-1 text-xs font-medium">
                      {index + 1}/{currentGroup.questions.length}
                    </Badge>
                    <div className="flex-1">
                      <QuestionRenderer
                        question={question}
                        value={responses[question.id]}
                        onChange={(value) => handleResponseChange(question.id, value)}
                      />
                    </div>
                  </div>
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
                  disabled={currentGroupIndex === 0}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                <div className="text-sm text-muted-foreground">
                  {currentGroupIndex + 1} of {questionGroups.length} sections
                </div>

                {currentGroupIndex === questionGroups.length - 1 ? (
                  <Button
                    onClick={() => setShowSummary(true)}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Review & Submit
                  </Button>
                ) : (
                  <Button
                    onClick={goToNext}
                    disabled={!canProceed() || saving}
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
    </div>
  );
};