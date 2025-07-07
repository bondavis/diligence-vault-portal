import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Download, FileText, FileSpreadsheet, Edit, CheckCircle2 } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { QuestionnaireExportDialog } from './QuestionnaireExportDialog';

type QuestionnaireQuestion = Database['public']['Tables']['questionnaire_questions']['Row'];

interface QuestionnaireSummaryProps {
  dealId: string;
  dealName?: string;
  questions: QuestionnaireQuestion[];
  responses: Record<string, any>;
  onBack: () => void;
  onComplete: () => void;
  onEdit: (questionId: string) => void;
  isCompleted: boolean;
}

export const QuestionnaireSummary = ({
  dealId,
  dealName,
  questions,
  responses,
  onBack,
  onComplete,
  onEdit,
  isCompleted
}: QuestionnaireSummaryProps) => {
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Group questions by category
  const categorizedQuestions = questions.reduce((acc, question) => {
    if (!acc[question.category]) {
      acc[question.category] = [];
    }
    acc[question.category].push(question);
    return acc;
  }, {} as Record<string, QuestionnaireQuestion[]>);

  const totalQuestions = questions.length;
  const answeredQuestions = questions.filter(q => responses[q.id] !== undefined).length;
  const completionPercentage = Math.round((answeredQuestions / totalQuestions) * 100);

  const formatResponse = (value: any, questionType: string): string => {
    if (value === null || value === undefined || value === '') {
      return 'Not answered';
    }
    
    if (questionType === 'yes_no') {
      return value === 'Yes' || value === true ? 'Yes' : 'No';
    }
    
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    
    return String(value);
  };

  const getResponseStatus = (questionId: string, isRequired: boolean) => {
    const hasResponse = responses[questionId] !== undefined && responses[questionId] !== '';
    
    if (hasResponse) {
      return { status: 'complete', color: 'text-green-600', bg: 'bg-green-50 border-green-200' };
    } else if (isRequired) {
      return { status: 'required', color: 'text-red-600', bg: 'bg-red-50 border-red-200' };
    } else {
      return { status: 'optional', color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200' };
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center">
                  {isCompleted && <CheckCircle2 className="h-6 w-6 text-green-600 mr-2" />}
                  Questionnaire Summary
                </CardTitle>
                <p className="text-muted-foreground mt-1">
                  {dealName && `Deal: ${dealName}`} • {completionPercentage}% Complete
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowExportDialog(true)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button onClick={onBack} variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Progress Overview */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{answeredQuestions}</div>
                <div className="text-sm text-muted-foreground">Questions Answered</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{totalQuestions - answeredQuestions}</div>
                <div className="text-sm text-muted-foreground">Remaining</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{completionPercentage}%</div>
                <div className="text-sm text-muted-foreground">Complete</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions by Category */}
        <div className="space-y-6">
          {Object.entries(categorizedQuestions).map(([category, categoryQuestions]) => {
            const answeredInCategory = categoryQuestions.filter(q => responses[q.id] !== undefined).length;
            const categoryCompletion = Math.round((answeredInCategory / categoryQuestions.length) * 100);

            return (
              <Card key={category}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{category}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant={categoryCompletion === 100 ? "default" : "secondary"}>
                        {answeredInCategory}/{categoryQuestions.length} ({categoryCompletion}%)
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categoryQuestions.map((question, index) => {
                      const responseValue = responses[question.id];
                      const { status, color, bg } = getResponseStatus(question.id, question.is_required);
                      
                      return (
                        <div key={question.id} className={index > 0 ? 'border-t pt-4' : ''}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-start space-x-2">
                                <p className="font-medium text-sm">
                                  {question.question_text}
                                  {question.is_required && <span className="text-red-500 ml-1">*</span>}
                                </p>
                              </div>
                              
                              {question.help_text && (
                                <p className="text-xs text-muted-foreground mt-1">{question.help_text}</p>
                              )}
                              
                              <div className={`mt-2 p-3 rounded-lg border ${bg}`}>
                                <p className={`text-sm ${color}`}>
                                  {formatResponse(responseValue, question.question_type)}
                                </p>
                              </div>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(question.id)}
                              className="ml-4"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Action Buttons */}
        {!isCompleted && (
          <Card className="mt-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-center space-x-4">
                <p className="text-sm text-muted-foreground">
                  {answeredQuestions === totalQuestions 
                    ? "All questions answered! You can now submit your questionnaire."
                    : `${totalQuestions - answeredQuestions} questions remaining. You can submit a partial questionnaire or continue answering.`
                  }
                </p>
              </div>
              <div className="flex justify-center mt-4">
                <Button
                  onClick={onComplete}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Submit Questionnaire
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Export Dialog */}
        <QuestionnaireExportDialog
          isOpen={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          dealId={dealId}
          dealName={dealName}
          questions={questions}
          responses={responses}
          categorizedQuestions={categorizedQuestions}
          completionPercentage={completionPercentage}
        />
      </div>
    </div>
  );
};