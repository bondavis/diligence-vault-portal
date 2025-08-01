
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Database } from '@/integrations/supabase/types';

type DiligenceRequest = Database['public']['Tables']['diligence_requests']['Row'] & {
  document_count?: number;
  has_response?: boolean;
  computed_status?: string;
};

interface BulkRequestActionsProps {
  selectedRequests: string[];
  onRequestsDeleted: () => void;
  onSelectionClear: () => void;
}

export const BulkRequestActions = ({ 
  selectedRequests, 
  onRequestsDeleted, 
  onSelectionClear 
}: BulkRequestActionsProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleBulkDelete = async () => {
    try {
      setIsDeleting(true);
      console.log('Starting bulk deletion for requests:', selectedRequests);

      // Delete comments first
      const { error: commentsError } = await supabase
        .from('request_comments')
        .delete()
        .in('request_id', selectedRequests);

      if (commentsError) {
        console.error('Error deleting comments:', commentsError);
        throw commentsError;
      }

      // Delete all documents associated with these requests
      const { error: documentsError } = await supabase
        .from('request_documents')
        .delete()
        .in('request_id', selectedRequests);

      if (documentsError) {
        console.error('Error deleting documents:', documentsError);
        throw documentsError;
      }

      // Delete all responses associated with these requests
      const { error: responsesError } = await supabase
        .from('diligence_responses')
        .delete()
        .in('request_id', selectedRequests);

      if (responsesError) {
        console.error('Error deleting responses:', responsesError);
        throw responsesError;
      }

      // Delete the requests themselves
      const { error: requestsError } = await supabase
        .from('diligence_requests')
        .delete()
        .in('id', selectedRequests);

      if (requestsError) {
        console.error('Error deleting requests:', requestsError);
        throw requestsError;
      }

      console.log('Successfully deleted all requests and related data');

      toast({
        title: "Success",
        description: `${selectedRequests.length} request(s) and all related data deleted successfully`,
      });

      // Clear selection immediately
      onSelectionClear();
      setShowDeleteDialog(false);
      
      // Add delay before triggering data refresh to ensure database operations are complete
      setTimeout(() => {
        onRequestsDeleted();
      }, 300);
    } catch (error) {
      console.error('Error during bulk deletion:', error);
      toast({
        title: "Error",
        description: `Failed to delete requests: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (selectedRequests.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex items-center space-x-2 p-4 bg-blue-50 border-b">
        <span className="text-sm text-blue-700">
          {selectedRequests.length} request(s) selected
        </span>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Selected
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onSelectionClear}
        >
          Clear Selection
        </Button>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>Delete Requests</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedRequests.length} request(s)? 
              This will also delete all associated documents and responses. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
