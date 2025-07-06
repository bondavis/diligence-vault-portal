import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type QuestionnaireQuestion = Database['public']['Tables']['questionnaire_questions']['Row'];
type QuestionnaireCategory = Database['public']['Enums']['questionnaire_category'];
type QuestionType = Database['public']['Enums']['question_type'];
type ResponsibleParty = Database['public']['Enums']['responsible_party'];

interface QuestionFormProps {
  question?: QuestionnaireQuestion | null;
  onSave: (questionData: {
    question_text: string;
    category: QuestionnaireCategory;
    question_type: QuestionType;
    responsible_party?: ResponsibleParty;
    is_required: boolean;
    help_text?: string;
    options?: any;
  }) => void;
  onCancel: () => void;
}

const categories: { value: QuestionnaireCategory; label: string }[] = [
  { value: 'Business Snapshot', label: 'Business Snapshot' },
  { value: 'Key Metrics', label: 'Key Metrics' },
  { value: 'Service Mix', label: 'Service Mix' },
  { value: 'Sales', label: 'Sales' },
  { value: 'HR', label: 'HR' },
  { value: 'Operational', label: 'Operational' },
  { value: 'Customer Experience', label: 'Customer Experience' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Technology & Systems', label: 'Technology & Systems' },
  { value: 'Facilities & Equipment', label: 'Facilities & Equipment' },
  { value: 'Compliance/Insurance/Safety', label: 'Compliance/Insurance/Safety' },
  { value: 'Deal Specific', label: 'Deal Specific' },
];

const questionTypes: { value: QuestionType; label: string }[] = [
  { value: 'text', label: 'Text Input' },
  { value: 'textarea', label: 'Long Text (Textarea)' },
  { value: 'number', label: 'Number Input' },
  { value: 'select', label: 'Dropdown Select' },
  { value: 'radio', label: 'Multiple Choice (Radio)' },
  { value: 'checkbox', label: 'Checkboxes' },
  { value: 'yes_no', label: 'Yes/No Toggle' },
];

const responsibleParties: { value: ResponsibleParty; label: string }[] = [
  { value: 'M&A', label: 'M&A' },
  { value: 'Ops', label: 'Operations' },
];

export const QuestionForm = ({ question, onSave, onCancel }: QuestionFormProps) => {
  const [formData, setFormData] = useState({
    question_text: '',
    category: 'Deal Specific' as QuestionnaireCategory,
    question_type: 'text' as QuestionType,
    responsible_party: 'M&A' as ResponsibleParty,
    is_required: false,
    help_text: '',
    options: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (question) {
      setFormData({
        question_text: question.question_text,
        category: question.category,
        question_type: question.question_type,
        responsible_party: question.responsible_party || 'M&A',
        is_required: question.is_required,
        help_text: question.help_text || '',
        options: question.options ? (Array.isArray(question.options) ? question.options.map(String) : []) : [],
      });
    }
  }, [question]);

  const needsOptions = ['select', 'radio', 'checkbox'].includes(formData.question_type);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.question_text.trim()) {
      newErrors.question_text = 'Question text is required';
    }

    if (needsOptions && formData.options.length === 0) {
      newErrors.options = 'At least one option is required for this question type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = {
      question_text: formData.question_text,
      category: formData.category,
      question_type: formData.question_type,
      responsible_party: formData.responsible_party,
      is_required: formData.is_required,
      help_text: formData.help_text || undefined,
      options: needsOptions ? formData.options : undefined,
    };

    onSave(submitData);
  };

  const addOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, ''],
    });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({
      ...formData,
      options: newOptions,
    });
  };

  const removeOption = (index: number) => {
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="text-gray-600 hover:text-gray-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Questions
              </Button>
            </div>
          </div>
          <CardTitle>
            {question ? 'Edit Question' : 'Add New Question'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Label htmlFor="question_text">Question Text *</Label>
                <Textarea
                  id="question_text"
                  value={formData.question_text}
                  onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                  placeholder="Enter your question..."
                  className={errors.question_text ? 'border-red-500' : ''}
                />
                {errors.question_text && (
                  <p className="text-sm text-red-600 mt-1">{errors.question_text}</p>
                )}
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: QuestionnaireCategory) => 
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="question_type">Question Type *</Label>
                <Select
                  value={formData.question_type}
                  onValueChange={(value: QuestionType) => 
                    setFormData({ ...formData, question_type: value, options: [] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select question type" />
                  </SelectTrigger>
                  <SelectContent>
                    {questionTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="responsible_party">Responsible Party</Label>
                <Select
                  value={formData.responsible_party}
                  onValueChange={(value: ResponsibleParty) => 
                    setFormData({ ...formData, responsible_party: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select responsible party" />
                  </SelectTrigger>
                  <SelectContent>
                    {responsibleParties.map((party) => (
                      <SelectItem key={party.value} value={party.value}>
                        {party.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_required"
                  checked={formData.is_required}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, is_required: checked })
                  }
                />
                <Label htmlFor="is_required">Required Question</Label>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="help_text">Help Text (Optional)</Label>
                <Input
                  id="help_text"
                  value={formData.help_text}
                  onChange={(e) => setFormData({ ...formData, help_text: e.target.value })}
                  placeholder="Additional instructions or examples..."
                />
              </div>
            </div>

            {needsOptions && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Options *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOption(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                {errors.options && (
                  <p className="text-sm text-red-600 mt-1">{errors.options}</p>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-bb-red hover:bg-red-700"
              >
                {question ? 'Update Question' : 'Create Question'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};