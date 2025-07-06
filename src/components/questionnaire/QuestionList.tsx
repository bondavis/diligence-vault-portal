import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Edit, Trash2, GripVertical } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type QuestionnaireQuestion = Database['public']['Tables']['questionnaire_questions']['Row'];

interface QuestionListProps {
  questions: QuestionnaireQuestion[];
  loading: boolean;
  onEdit: (question: QuestionnaireQuestion) => void;
  onDelete: (questionId: string) => void;
  onToggleActive: (questionId: string, isActive: boolean) => void;
  onReorder: () => void;
}

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    'Business Snapshot': 'bg-blue-100 text-blue-700 border-blue-200',
    'Key Metrics': 'bg-green-100 text-green-700 border-green-200',
    'Service Mix': 'bg-purple-100 text-purple-700 border-purple-200',
    'Sales': 'bg-orange-100 text-orange-700 border-orange-200',
    'HR': 'bg-pink-100 text-pink-700 border-pink-200',
    'Operational': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    'Customer Experience': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'Marketing': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Technology & Systems': 'bg-teal-100 text-teal-700 border-teal-200',
    'Facilities & Equipment': 'bg-red-100 text-red-700 border-red-200',
    'Compliance/Insurance/Safety': 'bg-amber-100 text-amber-700 border-amber-200',
    'Deal Specific': 'bg-gray-100 text-gray-700 border-gray-200'
  };
  return colors[category] || colors['Deal Specific'];
};

const getResponsiblePartyColor = (party: string) => {
  return party === 'M&A' 
    ? 'bg-blue-50 text-blue-600 border-blue-200'
    : 'bg-green-50 text-green-600 border-green-200';
};

export const QuestionList = ({
  questions,
  loading,
  onEdit,
  onDelete,
  onToggleActive,
  onReorder
}: QuestionListProps) => {
  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null);

  const groupedQuestions = questions.reduce((acc, question) => {
    const category = question.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(question);
    return acc;
  }, {} as Record<string, QuestionnaireQuestion[]>);

  const handleDeleteConfirm = () => {
    if (deleteQuestionId) {
      onDelete(deleteQuestionId);
      setDeleteQuestionId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-gray-500">Loading questions...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="text-gray-500 mb-4">No questions found</div>
            <p className="text-sm text-gray-400">Click "Add Question" to create your first questionnaire question.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedQuestions).map(([category, categoryQuestions]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span>{category}</span>
                <Badge className={getCategoryColor(category)}>
                  {categoryQuestions.length} questions
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categoryQuestions.map((question) => (
                <div
                  key={question.id}
                  className={`border rounded-lg p-4 ${
                    question.is_active ? 'bg-white' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                        <Badge variant="outline" className="text-xs">
                          {question.question_type}
                        </Badge>
                        {question.responsible_party && (
                          <Badge className={`text-xs ${getResponsiblePartyColor(question.responsible_party)}`}>
                            {question.responsible_party}
                          </Badge>
                        )}
                        {question.is_required && (
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                      
                      <p className={`font-medium ${!question.is_active ? 'text-gray-500' : 'text-gray-900'}`}>
                        {question.question_text}
                      </p>
                      
                      {question.help_text && (
                        <p className="text-sm text-gray-500 mt-1">
                          {question.help_text}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Active</span>
                        <Switch
                          checked={question.is_active}
                          onCheckedChange={(checked) => onToggleActive(question.id, checked)}
                        />
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(question)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Question</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this question? This action cannot be undone and will also delete all responses to this question.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDelete(question.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};