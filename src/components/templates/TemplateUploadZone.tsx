
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TemplateUploadZoneProps {
  onUploadComplete: () => void;
}

export const TemplateUploadZone = ({ onUploadComplete }: TemplateUploadZoneProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    details?: string[];
  }>({ type: null, message: '' });
  
  const { toast } = useToast();

  const processCSV = (csvText: string) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const templates = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      if (values.length < headers.length) continue;
      
      const template: any = {
        sort_order: i - 1
      };
      
      headers.forEach((header, index) => {
        const value = values[index] || '';
        
        switch (header) {
          case 'title':
            template.title = value;
            break;
          case 'description':
            template.description = value || null;
            break;
          case 'category':
            const validCategories = ['Financial', 'Legal', 'Operations', 'HR', 'IT', 'Environmental', 'Commercial', 'Other'];
            template.category = validCategories.includes(value) ? value : 'Other';
            break;
          case 'priority':
            const validPriorities = ['high', 'medium', 'low'];
            template.priority = validPriorities.includes(value.toLowerCase()) ? value.toLowerCase() : 'medium';
            break;
          case 'typical_period':
          case 'period':
            template.typical_period = value || null;
            break;
          case 'allow_file_upload':
          case 'file_upload':
            template.allow_file_upload = value.toLowerCase() !== 'false' && value !== '0';
            break;
          case 'allow_text_response':
          case 'text_response':
            template.allow_text_response = value.toLowerCase() !== 'false' && value !== '0';
            break;
        }
      });
      
      if (template.title) {
        templates.push(template);
      }
    }
    
    return templates;
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setUploadStatus({
        type: 'error',
        message: 'Please upload a CSV file',
      });
      return;
    }

    setUploading(true);
    setUploadStatus({ type: null, message: '' });

    try {
      const text = await file.text();
      const templates = processCSV(text);

      if (templates.length === 0) {
        setUploadStatus({
          type: 'error',
          message: 'No valid template items found in CSV',
          details: ['Ensure your CSV has a "title" column and valid data rows']
        });
        return;
      }

      // Clear existing templates first
      const { error: deleteError } = await supabase
        .from('request_templates')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteError) throw deleteError;

      // Insert new templates
      const { error: insertError } = await supabase
        .from('request_templates')
        .insert(templates);

      if (insertError) throw insertError;

      setUploadStatus({
        type: 'success',
        message: `Successfully uploaded ${templates.length} template items`,
      });

      toast({
        title: "Success",
        description: `Master template updated with ${templates.length} items`,
      });

      // Call the completion callback after a short delay
      setTimeout(() => {
        onUploadComplete();
      }, 1500);

    } catch (error) {
      console.error('Error processing CSV:', error);
      setUploadStatus({
        type: 'error',
        message: 'Failed to process CSV file',
        details: ['Please check your file format and try again']
      });
      
      toast({
        title: "Error",
        description: "Failed to upload template",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }, [onUploadComplete, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    multiple: false,
    disabled: uploading
  });

  return (
    <div className="space-y-4">
      <Card 
        {...getRootProps()} 
        className={`border-2 border-dashed cursor-pointer transition-colors ${
          isDragActive 
            ? 'border-blue-400 bg-blue-50' 
            : uploading 
              ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
              : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <CardContent className="flex flex-col items-center justify-center py-8">
          <input {...getInputProps()} />
          
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-sm text-gray-600">Processing CSV...</p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-gray-400 mb-4" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {isDragActive ? 'Drop CSV file here' : 'Upload Master Template CSV'}
                </p>
                <p className="text-xs text-gray-500">
                  Drag and drop or click to select a CSV file
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {uploadStatus.type && (
        <Alert variant={uploadStatus.type === 'error' ? 'destructive' : 'default'}>
          {uploadStatus.type === 'error' ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            <div>{uploadStatus.message}</div>
            {uploadStatus.details && (
              <ul className="mt-2 text-xs list-disc list-inside">
                {uploadStatus.details.map((detail, index) => (
                  <li key={index}>{detail}</li>
                ))}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-2">
            <FileText className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-gray-600">
              <p className="font-medium mb-1">CSV Format Requirements:</p>
              <ul className="space-y-1">
                <li>• <strong>title</strong> (required): Request title</li>
                <li>• <strong>description</strong>: Detailed description</li>
                <li>• <strong>category</strong>: Financial, Legal, Operations, HR, IT, Environmental, Commercial, Other</li>
                <li>• <strong>priority</strong>: high, medium, low</li>
                <li>• <strong>typical_period</strong>: e.g., "Last 2 Years", "Monthly"</li>
                <li>• <strong>allow_file_upload</strong>: true/false (default: true)</li>
                <li>• <strong>allow_text_response</strong>: true/false (default: true)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
