import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Eye } from 'lucide-react';
import { QuestionList } from './QuestionList';
import { QuestionForm } from './QuestionForm';
import { QuestionnairePreview } from './QuestionnairePreview';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type QuestionnaireQuestion = Database['public']['Tables']['questionnaire_questions']['Row'];
type QuestionnaireCategory = Database['public']['Enums']['questionnaire_category'];
type QuestionType = Database['public']['Enums']['question_type'];
type ResponsibleParty = Database['public']['Enums']['responsible_party'];

export const QuestionnaireManager = () => {
  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionnaireQuestion | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questionnaire_questions')
        .select('*')
        .order('category', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error loading questions:', error);
      toast({
        title: "Error",
        description: "Failed to load questionnaire questions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuestion = async (questionData: {
    question_text: string;
    category: QuestionnaireCategory;
    question_type: QuestionType;
    responsible_party?: ResponsibleParty;
    is_required: boolean;
    help_text?: string;
    options?: any;
  }) => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Not authenticated');

      if (editingQuestion) {
        // Update existing question
        const { error } = await supabase
          .from('questionnaire_questions')
          .update({
            ...questionData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingQuestion.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Question updated successfully",
        });
      } else {
        // Create new question
        const maxSortOrder = Math.max(
          ...questions
            .filter(q => q.category === questionData.category)
            .map(q => q.sort_order),
          -1
        );

        const { error } = await supabase
          .from('questionnaire_questions')
          .insert({
            ...questionData,
            sort_order: maxSortOrder + 1,
            created_by: user.data.user.id,
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Question created successfully",
        });
      }

      setShowForm(false);
      setEditingQuestion(null);
      loadQuestions();
    } catch (error) {
      console.error('Error saving question:', error);
      toast({
        title: "Error",
        description: "Failed to save question",
        variant: "destructive",
      });
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      const { error } = await supabase
        .from('questionnaire_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Question deleted successfully",
      });
      
      loadQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (questionId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('questionnaire_questions')
        .update({ is_active: isActive })
        .eq('id', questionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Question ${isActive ? 'activated' : 'deactivated'} successfully`,
      });
      
      loadQuestions();
    } catch (error) {
      console.error('Error toggling question status:', error);
      toast({
        title: "Error",
        description: "Failed to update question status",
        variant: "destructive",
      });
    }
  };

  const handleEditQuestion = (question: QuestionnaireQuestion) => {
    setEditingQuestion(question);
    setShowForm(true);
  };

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setShowForm(true);
  };

  if (showPreview) {
    return (
      <QuestionnairePreview
        questions={questions.filter(q => q.is_active)}
        onClose={() => setShowPreview(false)}
      />
    );
  }

  if (showForm) {
    return (
      <QuestionForm
        question={editingQuestion}
        onSave={handleSaveQuestion}
        onCancel={() => {
          setShowForm(false);
          setEditingQuestion(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-foreground">Post-LOI Questionnaire Manager</CardTitle>
              <CardDescription className="text-muted-foreground">
                Manage questionnaire questions and preview the seller experience
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                onClick={() => setShowPreview(true)}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview Questionnaire
              </Button>
              <Button
                variant="secondary"
                onClick={handleAddQuestion}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <QuestionList
        questions={questions}
        loading={loading}
        onEdit={handleEditQuestion}
        onDelete={handleDeleteQuestion}
        onToggleActive={handleToggleActive}
        onReorder={loadQuestions}
      />
    </div>
  );
};