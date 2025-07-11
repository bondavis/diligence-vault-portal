
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { InviteBBTUserModal } from './InviteBBTUserModal';
import { InviteSellerUserModal } from './InviteSellerUserModal';

interface UserActionsProps {
  onUserInvited: () => void;
}

export const UserActions = ({ onUserInvited }: UserActionsProps) => {
  const [bbtModalOpen, setBbtModalOpen] = useState(false);
  const [sellerModalOpen, setSellerModalOpen] = useState(false);

  return (
    <>
      <div className="flex space-x-2">
        <Button variant="outline" onClick={() => setBbtModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Invite BBT/Affiliate User
        </Button>
        <Button onClick={() => setSellerModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Invite Seller User
        </Button>
      </div>

      <InviteBBTUserModal
        open={bbtModalOpen}
        onOpenChange={setBbtModalOpen}
        onUserInvited={onUserInvited}
      />

      <InviteSellerUserModal
        open={sellerModalOpen}
        onOpenChange={setSellerModalOpen}
        onUserInvited={onUserInvited}
      />
    </>
  );
};
