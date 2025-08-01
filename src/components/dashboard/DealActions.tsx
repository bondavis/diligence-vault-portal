
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Upload, RefreshCw, ChevronDown } from 'lucide-react';

interface DealActionsProps {
  onLoadTemplate: (options?: { forceRefresh?: boolean }) => void;
  loadingTemplate: boolean;
  hasExistingRequests: boolean;
  templateApplied: boolean;
}

export const DealActions = ({ onLoadTemplate, loadingTemplate, hasExistingRequests, templateApplied }: DealActionsProps) => {
  const [showRefreshDialog, setShowRefreshDialog] = useState(false);

  const handleInitialLoad = () => {
    onLoadTemplate();
  };

  const handleRefresh = () => {
    if (hasExistingRequests) {
      setShowRefreshDialog(true);
    } else {
      onLoadTemplate({ forceRefresh: true });
    }
  };

  const confirmRefresh = () => {
    onLoadTemplate({ forceRefresh: true });
    setShowRefreshDialog(false);
  };

  return (
    <>
      <div className="flex items-center space-x-4">
        {!templateApplied ? (
          <Button onClick={handleInitialLoad} disabled={loadingTemplate}>
            <Upload className="h-4 w-4 mr-2" />
            {loadingTemplate ? 'Loading...' : 'Load Template Requests'}
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={loadingTemplate}>
                <Upload className="h-4 w-4 mr-2" />
                {loadingTemplate ? 'Loading...' : 'Template Actions'}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleInitialLoad}>
                <Plus className="h-4 w-4 mr-2" />
                Add Missing Requests
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset to Template
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Custom Request
        </Button>
      </div>

      <AlertDialog open={showRefreshDialog} onOpenChange={setShowRefreshDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will recreate ALL template requests, including any you may have deleted. 
              Your existing custom requests and any uploaded documents will not be affected.
              
              Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRefresh}>
              Yes, Reset to Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
