
import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';

interface DealActionsProps {
  onLoadTemplate: () => void;
  loadingTemplate: boolean;
}

export const DealActions = ({ onLoadTemplate, loadingTemplate }: DealActionsProps) => {
  return (
    <div className="flex items-center space-x-4">
      <Button onClick={onLoadTemplate} disabled={loadingTemplate}>
        <Upload className="h-4 w-4 mr-2" />
        {loadingTemplate ? 'Loading...' : 'Load Template Requests'}
      </Button>
      <Button variant="outline">
        <Plus className="h-4 w-4 mr-2" />
        Add Custom Request
      </Button>
    </div>
  );
};
