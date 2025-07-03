
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export const UserActions = () => {
  return (
    <div className="flex space-x-2">
      <Button variant="outline">
        <Plus className="h-4 w-4 mr-2" />
        Invite BBT/Affiliate User
      </Button>
      <Button>
        <Plus className="h-4 w-4 mr-2" />
        Invite Seller User
      </Button>
    </div>
  );
};
