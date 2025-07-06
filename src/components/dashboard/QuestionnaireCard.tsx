import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, CheckCircle, Clock, Play } from 'lucide-react';

interface QuestionnaireCardProps {
  status: {
    exists: boolean;
    completed: boolean;
    progress: number;
  };
  onStart: () => void;
  loading?: boolean;
}

export const QuestionnaireCard = ({ status, onStart, loading }: QuestionnaireCardProps) => {
  const getStatusBadge = () => {
    if (status.completed) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    } else if (status.exists) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          In Progress ({status.progress}%)
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
          <Play className="h-3 w-3 mr-1" />
          Not Started
        </Badge>
      );
    }
  };

  const getButtonText = () => {
    if (status.completed) {
      return 'Review Responses';
    } else if (status.exists) {
      return 'Continue Questionnaire';
    } else {
      return 'Start Questionnaire';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ClipboardList className="h-6 w-6 text-bb-red" />
            <div>
              <CardTitle className="text-lg">Post-LOI Questionnaire</CardTitle>
              <p className="text-sm text-gray-600">
                Complete the due diligence questionnaire for this deal
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {status.exists && !status.completed && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm text-gray-500">{status.progress}%</span>
              </div>
              <Progress value={status.progress} className="h-2" />
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {status.completed 
                ? 'You have successfully completed the questionnaire.'
                : status.exists 
                ? 'You can save your progress and return anytime.'
                : 'Answer questions about your business operations and metrics.'
              }
            </div>
            
            <Button
              onClick={onStart}
              disabled={loading}
              className={status.completed 
                ? 'bg-gray-600 hover:bg-gray-700' 
                : 'bg-bb-red hover:bg-red-700'
              }
            >
              {loading ? 'Loading...' : getButtonText()}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};