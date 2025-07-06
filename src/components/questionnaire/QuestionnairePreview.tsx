import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { QuestionRenderer } from './QuestionRenderer';
import { Database } from '@/integrations/supabase/types';

type QuestionnaireQuestion = Database['public']['Tables']['questionnaire_questions']['Row'];

interface QuestionnairePreviewProps {
  questions: QuestionnaireQuestion[];
  onClose: () => void;
}

export const QuestionnairePreview = ({ questions, onClose }: QuestionnairePreviewProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});

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

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses({
      ...responses,
      [questionId]: value,
    });
  };

  const canProceed = () => {
    // Check if current group's required questions are answered
    return currentGroup.every(question => {
      if (!question.is_required) return true;
      const response = responses[question.id];
      return response !== undefined && response !== null && response !== '';
    });
  };

  const goToNext = () => {
    if (currentQuestionIndex < totalGroups - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const isServiceMixGroup = currentGroup.length > 1 && currentGroup[0]?.category === 'Service Mix';

  return (
    <div className="min-h-screen bg-bb-light-gray p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Post-LOI Questionnaire Preview</CardTitle>
                <p className="text-gray-600 mt-1">
                  This is how sellers will experience the questionnaire
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-gray-600 hover:text-gray-700"
              >
                <X className="h-4 w-4 mr-2" />
                Close Preview
              </Button>
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
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={!canProceed()}
                >
                  Complete Questionnaire
                </Button>
              ) : (
                <Button
                  onClick={goToNext}
                  disabled={!canProceed()}
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