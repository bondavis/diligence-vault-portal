
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Users, CheckCircle, XCircle, UserPlus } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface BulkOperationsPanelProps {
  selectedRequests: string[];
  users: User[];
  onOperationComplete: () => void;
}

export const BulkOperationsPanel = ({
  selectedRequests,
  users,
  onOperationComplete
}: BulkOperationsPanelProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const { toast } = useToast();

  const handleBulkAssign = async () => {
    if (!selectedUserId || selectedRequests.length === 0) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('diligence_requests')
        .update({ 
          assigned_to: selectedUserId,
          updated_at: new Date().toISOString()
        })
        .in('id', selectedRequests);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Assigned ${selectedRequests.length} requests successfully`,
      });

      onOperationComplete();
    } catch (error) {
      console.error('Error bulk assigning:', error);
      toast({
        title: "Error",
        description: "Failed to assign requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedRequests.length === 0) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('diligence_requests')
        .update({ 
          status: status as any,
          updated_at: new Date().toISOString()
        })
        .in('id', selectedRequests);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Updated ${selectedRequests.length} requests to ${status}`,
      });

      onOperationComplete();
    } catch (error) {
      console.error('Error bulk updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update request status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-blue-600" />
          <span className="font-medium text-blue-900">
            {selectedRequests.length} request{selectedRequests.length !== 1 ? 's' : ''} selected
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Bulk Assignment */}
          <div className="flex items-center space-x-2">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select user to assign" />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={handleBulkAssign}
              disabled={!selectedUserId || loading}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Assign
            </Button>
          </div>

          {/* Status Updates */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleBulkStatusUpdate('approved')}
            disabled={loading}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => handleBulkStatusUpdate('rejected')}
            disabled={loading}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
        </div>
      </div>
    </div>
  );
};
