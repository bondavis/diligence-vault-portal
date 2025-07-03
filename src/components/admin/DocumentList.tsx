
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Download, Trash2, File, FileText, Image, FileSpreadsheet } from 'lucide-react';

interface DocumentListProps {
  documents: any[];
  onDocumentUpdate: () => void;
}

export const DocumentList = ({ documents, onDocumentUpdate }: DocumentListProps) => {
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (fileType.includes('image')) return <Image className="h-5 w-5 text-blue-500" />;
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async (document: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('request-documents')
        .download(document.storage_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (documentId: string, storagePath: string) => {
    try {
      setDeleting(documentId);

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('request-documents')
        .remove([storagePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('request_documents')
        .delete()
        .eq('id', documentId);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Document deleted successfully",
      });

      onDocumentUpdate();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No documents uploaded yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((document) => (
        <div key={document.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
          <div className="flex items-center space-x-3">
            {getFileIcon(document.file_type)}
            <div>
              <div className="font-medium">{document.filename}</div>
              <div className="text-sm text-gray-500">
                {formatFileSize(document.file_size)} • 
                Uploaded {new Date(document.uploaded_at).toLocaleDateString()}
                {document.is_sample_document && (
                  <Badge variant="secondary" className="ml-2">Sample</Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownload(document)}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(document.id, document.storage_path)}
              disabled={deleting === document.id}
              className="text-red-600 hover:text-red-800"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
