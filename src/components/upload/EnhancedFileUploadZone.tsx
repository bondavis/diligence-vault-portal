import { useState, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Upload, X, File, CheckCircle, Image, FileText, AlertCircle, Eye, Download, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { auditLogger } from '@/utils/auditLogger';
import { validateFileName } from '@/utils/inputValidation';

interface EnhancedFileUploadZoneProps {
  requestId: string;
  onUploadComplete?: () => void;
}

interface UploadFile extends File {
  id: string;
  preview?: string;
  error?: string;
}

interface DocumentVersion {
  id: string;
  filename: string;
  file_size: number;
  uploaded_at: string;
  uploaded_by: string;
  storage_path: string;
  file_type: string;
  version?: number;
}

export const EnhancedFileUploadZone = ({ requestId, onUploadComplete }: EnhancedFileUploadZoneProps) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<DocumentVersion[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const maxFileSize = 50 * 1024 * 1024; // 50MB
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png',
    'image/jpeg',
    'image/jpg'
  ];

  useEffect(() => {
    loadDocuments();
  }, [requestId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const { data: documents, error } = await supabase
        .from('request_documents')
        .select('*')
        .eq('request_id', requestId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      
      // Group documents by filename to show versions
      const groupedDocs = (documents || []).reduce((acc: Record<string, DocumentVersion[]>, doc) => {
        const baseName = doc.filename.replace(/\(\d+\)\./, '.'); // Remove version numbers
        if (!acc[baseName]) acc[baseName] = [];
        acc[baseName].push(doc);
        return acc;
      }, {});

      // Flatten and add version numbers
      const versioned = Object.values(groupedDocs).flatMap(versions => 
        versions.map((doc, index) => ({
          ...doc,
          version: versions.length - index
        }))
      );

      setUploadedDocuments(versioned);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File size exceeds 50MB limit`;
    }
    if (!allowedTypes.includes(file.type)) {
      return `File type not supported. Please use PDF, DOC, DOCX, XLS, XLSX, or image files.`;
    }
    
    // Enhanced filename validation using utility function
    const filenameValidation = validateFileName(file.name);
    if (!filenameValidation.isValid) {
      return filenameValidation.error;
    }
    
    // Additional security: check file extension matches MIME type
    const extension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg'];
    if (!extension || !validExtensions.includes(extension)) {
      return `Invalid file extension. Only ${validExtensions.join(', ')} files are allowed.`;
    }
    
    return null;
  };

  const createFilePreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  };

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    await processFiles(droppedFiles);
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      await processFiles(selectedFiles);
    }
  };

  const processFiles = async (newFiles: File[]) => {
    const processedFiles: UploadFile[] = [];
    
    for (const file of newFiles) {
      const error = validateFile(file);
      const preview = await createFilePreview(file);
      
      processedFiles.push({
        ...file,
        id: Date.now() + Math.random().toString(36),
        preview,
        error: error || undefined
      });
    }
    
    setFiles(prev => [...prev, ...processedFiles]);
    
    // Show validation errors
    const errorsCount = processedFiles.filter(f => f.error).length;
    if (errorsCount > 0) {
      toast({
        title: "File Validation",
        description: `${errorsCount} file(s) have validation errors. Please review and remove them.`,
        variant: "destructive",
      });
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const uploadFiles = async () => {
    const validFiles = files.filter(f => !f.error);
    if (validFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${requestId}/${Date.now()}_${file.name}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('request-documents')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Save document metadata to database
        const { error: dbError } = await supabase
          .from('request_documents')
          .insert({
            request_id: requestId,
            filename: file.name,
            file_size: file.size,
            file_type: file.type,
            storage_path: fileName,
            uploaded_by: user.id,
          });

        if (dbError) throw dbError;

        // Log file upload for audit
        await auditLogger.logFileUpload(file.name, file.size, requestId);

        // Update progress
        setUploadProgress(((i + 1) / validFiles.length) * 100);
      }

      toast({
        title: "Upload Complete",
        description: `${validFiles.length} file(s) uploaded successfully`,
      });

      setFiles([]);
      loadDocuments();
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500" />;
    if (fileType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (fileType.includes('word')) return <FileText className="h-5 w-5 text-blue-600" />;
    if (fileType.includes('excel') || fileType.includes('sheet')) return <FileText className="h-5 w-5 text-green-600" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const downloadDocument = async (doc: DocumentVersion) => {
    try {
      const { data, error } = await supabase.storage
        .from('request-documents')
        .download(doc.storage_path);

      if (error) throw error;

      // Log file download for audit
      await auditLogger.logFileDownload(doc.filename, doc.id);

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const validFiles = files.filter(f => !f.error);
  const hasErrors = files.some(f => f.error);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Enhanced Drop Zone */}
        <Card
          className={`border-2 border-dashed transition-all duration-200 ${
            isDragOver 
              ? 'border-blue-400 bg-blue-50 scale-[1.02]' 
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50/50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="p-8 text-center">
            <div className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
              isDragOver ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              <Upload className={`h-8 w-8 transition-colors ${
                isDragOver ? 'text-blue-600' : 'text-gray-400'
              }`} />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">
                {isDragOver ? 'Drop files here' : 'Drag & drop files here'}
              </p>
              <p className="text-sm text-gray-600">
                or <span className="text-blue-600 font-medium">browse from your computer</span>
              </p>
              <p className="text-xs text-gray-500">
                Supports PDF, DOC, DOCX, XLS, XLSX, images • Max 50MB per file
              </p>
            </div>
            <input
              type="file"
              multiple
              className="hidden"
              id={`file-upload-${requestId}`}
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            />
            <label
              htmlFor={`file-upload-${requestId}`}
              className="mt-6 inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose Files
            </label>
          </div>
        </Card>

        {/* Selected Files List */}
        {files.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-lg">
                Selected Files ({files.length})
                {hasErrors && <AlertCircle className="inline-block h-4 w-4 text-red-500 ml-2" />}
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFiles([])}
                disabled={uploading}
              >
                Clear All
              </Button>
            </div>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {files.map((file) => (
                <div 
                  key={file.id} 
                  className={`flex items-center space-x-4 p-4 rounded-lg border ${
                    file.error ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  {/* File preview/icon */}
                  <div className="flex-shrink-0">
                    {file.preview ? (
                      <img 
                        src={file.preview} 
                        alt={file.name}
                        className="h-12 w-12 object-cover rounded-lg border"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-white rounded-lg border flex items-center justify-center">
                        {getFileIcon(file.type)}
                      </div>
                    )}
                  </div>
                  
                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    {file.error && (
                      <p className="text-xs text-red-600 mt-1">{file.error}</p>
                    )}
                  </div>
                  
                  {/* Remove button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-100"
                        disabled={uploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Remove file</TooltipContent>
                  </Tooltip>
                </div>
              ))}
            </div>
            
            {/* Upload progress */}
            {uploading && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Uploading files...</span>
                  <span className="font-medium">{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
            
            {/* Upload button */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">
                {validFiles.length} of {files.length} files ready to upload
              </p>
              <div className="flex space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => setFiles(files.filter(f => !f.error))}
                  disabled={uploading || !hasErrors}
                  size="sm"
                >
                  Remove Invalid
                </Button>
                <Button 
                  onClick={uploadFiles} 
                  disabled={uploading || validFiles.length === 0}
                  className="min-w-[120px]"
                >
                  {uploading ? (
                    <>
                      <Upload className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload {validFiles.length} File{validFiles.length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Uploaded Documents with Version History */}
        {uploadedDocuments.length > 0 && (
          <Card className="p-6">
            <h4 className="font-medium text-lg mb-4 flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              Uploaded Documents ({uploadedDocuments.length})
            </h4>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {uploadedDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(doc.file_type)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.filename}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(doc.file_size)} • 
                        Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                        {doc.version && doc.version > 1 && ` • Version ${doc.version}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadDocument(doc)}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Download file</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Enhanced Help Note */}
        <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-2">
            <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-900 mb-1">Upload Guidelines</p>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Files are securely stored and can be downloaded anytime</li>
                <li>• Drag & drop multiple files for faster uploads</li>
                <li>• File versions are automatically tracked</li>
                <li>• All uploads are logged with timestamps for audit purposes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};