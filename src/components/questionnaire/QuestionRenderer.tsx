import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Database } from '@/integrations/supabase/types';
import { validateQuestionnaireResponse } from '@/utils/inputValidation';
import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HelpCircle, CheckCircle } from 'lucide-react';

type QuestionnaireQuestion = Database['public']['Tables']['questionnaire_questions']['Row'];

interface QuestionRendererProps {
  question: QuestionnaireQuestion;
  value: any;
  onChange: (value: any) => void;
}

export const QuestionRenderer = ({ question, value, onChange }: QuestionRendererProps) => {
  const options = question.options ? (Array.isArray(question.options) ? question.options.map(String) : []) : [];
  const [validationError, setValidationError] = useState<string>('');

  const handleChange = (newValue: any) => {
    const validation = validateQuestionnaireResponse(String(newValue), question.question_type);
    
    if (validation.isValid) {
      setValidationError('');
      onChange(validation.sanitized);
    } else {
      setValidationError(validation.error || 'Invalid input');
    }
  };

  const renderInput = () => {
    switch (question.question_type) {
      case 'text':
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Enter your answer..."
            className="w-full"
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Enter your detailed answer..."
            className="w-full min-h-[100px]"
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Enter a number..."
            className="w-full"
          />
        );

      case 'select':
        return (
          <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an option..." />
            </SelectTrigger>
            <SelectContent>
              {options.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'radio':
        return (
          <RadioGroup value={value || ''} onValueChange={onChange}>
            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                  <Label htmlFor={`${question.id}-${index}`} className="cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        );

      case 'checkbox':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-3">
            {options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${index}`}
                  checked={selectedValues.includes(option)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([...selectedValues, option]);
                    } else {
                      onChange(selectedValues.filter((v: string) => v !== option));
                    }
                  }}
                />
                <Label htmlFor={`${question.id}-${index}`} className="cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'yes_no':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-center space-x-6 p-4 bg-gray-50 rounded-lg">
              <button
                type="button"
                onClick={() => onChange('No')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  value === 'No' 
                    ? 'bg-red-500 text-white shadow-md' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                }`}
              >
                No
              </button>
              <button
                type="button"
                onClick={() => onChange('Yes')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  value === 'Yes' 
                    ? 'bg-green-500 text-white shadow-md' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                }`}
              >
                Yes
              </button>
            </div>
            {!value && (
              <p className="text-sm text-amber-600 text-center">Please select Yes or No</p>
            )}
          </div>
        );

      default:
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter your answer..."
            className="w-full"
          />
        );
    }
  };

  const getQuestionExplanation = (questionType: string) => {
    const explanations = {
      'number': 'Enter a numeric value (e.g., 150, 2.5, 1000)',
      'select': 'Choose one option from the dropdown menu',
      'radio': 'Select one option from the choices below',
      'checkbox': 'You can select multiple options that apply',
      'yes_no': 'Toggle the switch to answer Yes or No',
      'textarea': 'Provide a detailed response in the text area below'
    };
    return explanations[questionType] || 'Enter your response in the field below';
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <Label className="text-base font-semibold text-gray-900 leading-relaxed flex-1">
            {question.question_text}
            {question.is_required && (
              <span className="text-red-500 ml-1 font-bold">*</span>
            )}
          </Label>
          {question.responsible_party && (
            <Badge variant="outline" className="ml-3 text-xs bg-gray-50">
              {question.responsible_party} Team
            </Badge>
          )}
        </div>
        
        {question.help_text && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <HelpCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">Context & Guidance</p>
                <p className="text-sm text-blue-800">{question.help_text}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
          💡 {getQuestionExplanation(question.question_type)}
        </div>
      </div>
      
      <div className="space-y-2">
        {renderInput()}
        {validationError && (
          <Alert variant="destructive" className="mt-2">
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}
        {value && !validationError && (
          <div className="flex items-center space-x-1 text-xs text-green-600">
            <CheckCircle className="h-3 w-3" />
            <span>Answer saved</span>
          </div>
        )}
      </div>
    </div>
  );
};