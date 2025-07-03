
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Deal {
  id: string;
  name: string;
  project_name: string;
  company_name: string;
}

interface DiligenceRequestUploadProps {
  onUploadComplete?: () => void;
}

// Category mapping for common variations
const CATEGORY_MAPPING: Record<string, string> = {
  'Finance': 'Financial',
  'Financial': 'Financial',
  'Legal': 'Legal',
  'Operations': 'Operations',
  'HR': 'HR',
  'IT': 'IT',
  'Environmental': 'Environmental',
  'Commercial': 'Commercial',
  'Other': 'Other',
  'Military': 'Other', // Map unsupported categories to 'Other'
  'rebate programs': 'Commercial',
  'AP aging report': 'Financial',
  'passports': 'HR',
  'hire date': 'HR',
  'parts': 'Operations',
  'by employee': 'HR',
  'and if needed': 'Other',
  'if different': 'Other'
};

const PRIORITY_MAPPING: Record<string, string> = {
  'high': 'high',
  'medium': 'medium',
  'low': 'low',
  'High': 'high',
  'Medium': 'medium',
  'Low': 'low'
};

export const DiligenceRequestUpload = ({ onUploadComplete }: DiligenceRequestUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<string>('');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{ success: number; errors: string[] } | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadResults(null);
    }
  };

  const loadDeals = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('deals')
        .select('id, name, project_name, company_name')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeals(data || []);
    } catch (error) {
      console.error('Error loading deals:', error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadDeals();
  }, []);

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header.toLowerCase().replace(/\s+/g, '_')] = values[index] || '';
      });
      
      if (row.title && row.title.trim()) {
        data.push(row);
      }
    }

    return data;
  };

  const validateAndCleanData = (request: any, rowIndex: number): { data: any; error: string | null } => {
    const errors: string[] = [];

    // Clean title
    if (!request.title || !request.title.trim()) {
      errors.push('Title is required');
    }

    // Map and validate category
    let category = 'Other';
    if (request.category) {
      const mappedCategory = CATEGORY_MAPPING[request.category.trim()];
      if (mappedCategory) {
        category = mappedCategory;
      } else {
        // If not found in mapping, default to 'Other' and note it
        category = 'Other';
        console.log(`Row ${rowIndex + 2}: Unknown category "${request.category}" mapped to "Other"`);
      }
    }

    // Map and validate priority
    let priority = 'medium';
    if (request.priority) {
      const mappedPriority = PRIORITY_MAPPING[request.priority.trim()];
      if (mappedPriority) {
        priority = mappedPriority;
      }
    }

    // Parse due_date from period field
    let due_date = null;
    if (request.period && request.period.trim()) {
      const periodText = request.period.trim();
      // Skip invalid date formats like "Last month" or very long descriptions
      if (periodText.length < 50 && !periodText.toLowerCase().includes('last month')) {
        // Try to parse common date formats
        const datePatterns = [
          /^Q(\d)\s+(\d{4})$/i, // Q1 2024, Q4 2024
          /^(\w+)\s+(\d{4})$/i, // January 2025, December 2024
          /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // 2024-12-31
          /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/ // 12/31/2024
        ];

        for (const pattern of datePatterns) {
          const match = periodText.match(pattern);
          if (match) {
            if (pattern.source.includes('Q')) {
              // Quarter format: Q1 2024 -> 2024-03-31
              const quarter = parseInt(match[1]);
              const year = parseInt(match[2]);
              const month = quarter * 3; // Q1=3, Q2=6, Q3=9, Q4=12
              due_date = `${year}-${month.toString().padStart(2, '0')}-28`;
            } else if (pattern.source.includes('w+')) {
              // Month Year format: January 2025 -> 2025-01-31
              const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                               'july', 'august', 'september', 'october', 'november', 'december'];
              const monthIndex = monthNames.indexOf(match[1].toLowerCase());
              if (monthIndex >= 0) {
                due_date = `${match[2]}-${(monthIndex + 1).toString().padStart(2, '0')}-28`;
              }
            } else {
              // Standard date formats
              due_date = periodText;
            }
            break;
          }
        }
      }
    }

    if (errors.length > 0) {
      return { data: null, error: errors.join(', ') };
    }

    return {
      data: {
        title: request.title.trim(),
        description: request.description || '',
        category,
        priority,
        due_date,
        allow_file_upload: request.allow_file_upload === 'false' ? false : true,
        allow_text_response: request.allow_text_response === 'false' ? false : true
      },
      error: null
    };
  };

  const handleUpload = async () => {
    if (!file || !selectedDeal) {
      toast({
        title: "Missing Information",
        description: "Please select a file and project before uploading",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const errors: string[] = [];
    let successCount = 0;

    try {
      const csvText = await file.text();
      const requests = parseCSV(csvText);

      if (requests.length === 0) {
        throw new Error('No valid requests found in CSV file');
      }

      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) {
        throw new Error('User not authenticated');
      }

      for (const [index, request] of requests.entries()) {
        try {
          const { data: cleanedData, error: validationError } = validateAndCleanData(request, index);
          
          if (validationError) {
            errors.push(`Row ${index + 2}: ${validationError}`);
            continue;
          }

          const requestData = {
            deal_id: selectedDeal,
            created_by: currentUser.data.user.id,
            ...cleanedData
          };

          const { error } = await (supabase as any)
            .from('diligence_requests')
            .insert([requestData]);

          if (error) {
            console.error('Database error:', error);
            errors.push(`Row ${index + 2}: ${error.message}`);
          } else {
            successCount++;
          }
        } catch (error) {
          console.error('Row processing error:', error);
          errors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      setUploadResults({ success: successCount, errors });
      
      if (successCount > 0) {
        toast({
          title: "Upload Complete",
          description: `Successfully uploaded ${successCount} requests`,
        });
        onUploadComplete?.();
      }

      if (errors.length > 0) {
        toast({
          title: "Upload Issues",
          description: `${errors.length} rows had errors. Check results below.`,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Error",
        description: error instanceof Error ? error.message : 'Failed to process file',
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      'title,description,category,priority,period,allow_file_upload,allow_text_response',
      'Audited Financial Statements,"Please provide audited financial statements for the last 3 years",Financial,high,Q4 2024,true,false',
      'Revenue Recognition Policy,"Describe the company\'s revenue recognition policy",Financial,medium,January 2025,true,true',
      'Material Contracts,"Upload all material contracts",Legal,high,Q1 2025,true,false',
      'Employee Handbook,"Provide current employee handbook",HR,medium,February 2025,true,true'
    ].join('\n');

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diligence_requests_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="h-5 w-5" />
          <span>Upload Diligence Requests</span>
        </CardTitle>
        <CardDescription>
          Upload a CSV file containing diligence requests with their characteristics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template Download */}
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">Need a template?</p>
              <p className="text-sm text-blue-700">Download our CSV template to get started</p>
            </div>
          </div>
          <Button variant="outline" onClick={downloadTemplate} className="text-blue-600 border-blue-600">
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
        </div>

        {/* Deal Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Project</label>
          <Select value={selectedDeal} onValueChange={setSelectedDeal}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a project for these requests" />
            </SelectTrigger>
            <SelectContent>
              {deals.map(deal => (
                <SelectItem key={deal.id} value={deal.id}>
                  {deal.project_name} - {deal.company_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium">CSV File</label>
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-bb-red file:text-white"
          />
          {file && (
            <p className="text-sm text-gray-600">
              Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        {/* Upload Button */}
        <Button 
          onClick={handleUpload} 
          disabled={!file || !selectedDeal || uploading}
          className="w-full bg-bb-red hover:bg-red-700"
        >
          {uploading ? 'Uploading...' : 'Upload Requests'}
        </Button>

        {/* Upload Results */}
        {uploadResults && (
          <div className="space-y-3">
            {uploadResults.success > 0 && (
              <div className="flex items-center space-x-2 text-green-700 bg-green-50 p-3 rounded-lg">
                <CheckCircle className="h-5 w-5" />
                <span>Successfully uploaded {uploadResults.success} requests</span>
              </div>
            )}
            
            {uploadResults.errors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-red-700 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="h-5 w-5" />
                  <span>{uploadResults.errors.length} errors occurred:</span>
                </div>
                <div className="bg-red-50 p-3 rounded-lg max-h-40 overflow-y-auto">
                  {uploadResults.errors.map((error, index) => (
                    <p key={index} className="text-sm text-red-600">{error}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CSV Format Instructions */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
          <p className="font-medium mb-2">CSV Format Requirements:</p>
          <ul className="space-y-1">
            <li>• <strong>title</strong> (required): Request title</li>
            <li>• <strong>description</strong>: Detailed description</li>
            <li>• <strong>category</strong>: Financial, Legal, Operations, HR, IT, Environmental, Commercial, Other</li>
            <li>• <strong>priority</strong>: high, medium, low</li>
            <li>• <strong>period</strong>: Time period or deadline (e.g., "Q4 2024", "January 2025")</li>
            <li>• <strong>allow_file_upload</strong>: true/false</li>
            <li>• <strong>allow_text_response</strong>: true/false</li>
          </ul>
          <div className="mt-2 p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
            <p className="text-yellow-800 text-xs">
              <strong>Note:</strong> Categories will be automatically mapped to valid values. Unknown categories will be set to "Other".
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
