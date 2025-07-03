
import { useState } from 'react';
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
  code: string;
}

interface DiligenceRequestUploadProps {
  onUploadComplete?: () => void;
}

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
      const { data, error } = await supabase
        .from('deals')
        .select('id, name, code')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeals(data || []);
    } catch (error) {
      console.error('Error loading deals:', error);
      toast({
        title: "Error",
        description: "Failed to load deals",
        variant: "destructive",
      });
    }
  };

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

  const handleUpload = async () => {
    if (!file || !selectedDeal) {
      toast({
        title: "Missing Information",
        description: "Please select a file and deal before uploading",
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

      for (const [index, request] of requests.entries()) {
        try {
          const requestData = {
            deal_id: selectedDeal,
            title: request.title,
            description: request.description || '',
            category: request.category || 'Other',
            priority: request.priority || 'medium',
            due_date: request.due_date || null,
            allow_file_upload: request.allow_file_upload === 'false' ? false : true,
            allow_text_response: request.allow_text_response === 'false' ? false : true,
            created_by: (await supabase.auth.getUser()).data.user?.id
          };

          const { error } = await supabase
            .from('diligence_requests')
            .insert([requestData]);

          if (error) throw error;
          successCount++;
        } catch (error) {
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

    } catch (error) {
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
      'title,description,category,priority,due_date,allow_file_upload,allow_text_response',
      'Audited Financial Statements,"Please provide audited financial statements for the last 3 years",Financial,high,2024-12-31,true,false',
      'Revenue Recognition Policy,"Describe the company\'s revenue recognition policy",Financial,medium,,true,true',
      'Material Contracts,"Upload all material contracts",Legal,high,2024-11-30,true,false'
    ].join('\n');

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diligence_requests_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Load deals when component mounts
  useState(() => {
    loadDeals();
  });

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
          <label className="text-sm font-medium">Select Deal</label>
          <Select value={selectedDeal} onValueChange={setSelectedDeal}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a deal for these requests" />
            </SelectTrigger>
            <SelectContent>
              {deals.map(deal => (
                <SelectItem key={deal.id} value={deal.id}>
                  {deal.name} ({deal.code})
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
            <li>• <strong>due_date</strong>: YYYY-MM-DD format</li>
            <li>• <strong>allow_file_upload</strong>: true/false</li>
            <li>• <strong>allow_text_response</strong>: true/false</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
