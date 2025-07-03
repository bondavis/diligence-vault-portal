import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ListChecks, UploadCloud } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/lib/database.types';
import { useDeals } from '@/hooks/use-deals';
import Papa from 'papaparse';

interface DiligenceRequestUploadProps {
  onUploadComplete: () => void;
}

export const DiligenceRequestUpload = ({ onUploadComplete }: DiligenceRequestUploadProps) => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { user } = useUser();
  const { toast } = useToast();
  const { deals } = useDeals();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setCsvFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'text/csv': ['.csv'] } });

  const handleDealSelect = (value: string) => {
    setSelectedDeal(value);
  };

  const processCSVData = async (csvData: any[]) => {
    try {
      console.log('Processing CSV data:', csvData);
      console.log('Sample row structure:', csvData[0]);
      
      const requests = csvData.map(row => {
        console.log('Processing row:', {
          title: row.title || row.Title,
          period: row.period || row.Period,
          periodText: row.period_text || row['Period Text'],
          allKeys: Object.keys(row)
        });

        return {
          title: row.title || row.Title || 'Untitled Request',
          description: row.description || row.Description || null,
          category: (row.category || row.Category || 'Other') as Database['public']['Enums']['request_category'],
          priority: (row.priority || row.Priority || 'medium').toLowerCase() as Database['public']['Enums']['request_priority'],
          status: 'pending' as Database['public']['Enums']['request_status'],
          period_text: row.period || row.Period || row.period_text || row['Period Text'] || null,
          period_start: row.period_start || row['Period Start'] ? new Date(row.period_start || row['Period Start']).toISOString().split('T')[0] : null,
          period_end: row.period_end || row['Period End'] ? new Date(row.period_end || row['Period End']).toISOString().split('T')[0] : null,
          due_date: row.due_date || row['Due Date'] ? new Date(row.due_date || row['Due Date']).toISOString().split('T')[0] : null,
          allow_file_upload: true,
          allow_text_response: true,
          deal_id: selectedDeal,
          created_by: user.id
        };
      });

      console.log('Processed requests with period data:', requests.map(r => ({
        title: r.title,
        period_text: r.period_text,
        period_start: r.period_start,
        period_end: r.period_end
      })));

      setUploading(true);
      const { data, error } = await supabase
        .from('diligence_requests')
        .insert(requests);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Diligence requests uploaded successfully!",
      });
      onUploadComplete();
    } catch (error) {
      console.error('Error processing CSV:', error);
      toast({
        title: "Error",
        description: "Failed to upload diligence requests. Please check the CSV file format and try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = () => {
    if (!csvFile) {
      toast({
        title: "Error",
        description: "Please select a CSV file to upload.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedDeal) {
      toast({
        title: "Error",
        description: "Please select a deal to associate the requests with.",
        variant: "destructive",
      });
      return;
    }

    Papa.parse(csvFile, {
      header: true,
      complete: (results) => {
        processCSVData(results.data);
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        toast({
          title: "Error",
          description: "Failed to parse CSV file. Please check the file format and try again.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Diligence Requests</CardTitle>
        <CardDescription>Upload a CSV file containing diligence request data.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="deal">Select Deal</Label>
          <Select onValueChange={handleDealSelect}>
            <SelectTrigger id="deal">
              <SelectValue placeholder="Select a deal" />
            </SelectTrigger>
            <SelectContent>
              {deals.map((deal) => (
                <SelectItem key={deal.id} value={deal.id}>{deal.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div {...getRootProps()} className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer">
          <input {...getInputProps()} />
          <UploadCloud className="mx-auto h-8 w-8 text-gray-400" />
          {
            isDragActive ?
              <p className="text-gray-500">Drop the files here ...</p> :
              <p className="text-gray-500">Drag 'n' drop a CSV file here, or click to select a file</p>
          }
          {csvFile && (
            <div className="mt-2">
              <p className="text-gray-700 font-medium">Selected file: {csvFile.name}</p>
            </div>
          )}
        </div>
        <Button disabled={uploading} onClick={handleUpload}>
          {uploading ? (
            <>
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 4V2a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2h-1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2H9v2a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2H6v2a1 1 0 0 1-1 1a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1 1 1h2a1 1 0 0 1 1-1zM21 14h-2a1 1 0 0 1-1-1v-1h-2a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h2v-1a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h2v1a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2zM13 22h-2a1 1 0 0 1-1-1v-2h-2a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h2v-2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2v2a1 1 0 0 1-1 1v2a1 1 0 0 1 1 1h2z" />
              </svg>
              Uploading...
            </>
          ) : (
            <>
              <UploadCloud className="h-4 w-4 mr-2" />
              Upload CSV
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
