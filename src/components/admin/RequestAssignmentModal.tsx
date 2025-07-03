
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  name: string;
  email: string;
}

interface RequestAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string | null;
  users: User[];
  onAssignmentComplete: () => void;
}

export const RequestAssignmentModal = ({
  open,
  onOpenChange,
  requestId,
  users,
  onAssignmentComplete
}: RequestAssignmentModalProps) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [request, setRequest] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && requestId) {
      loadRequest();
    }
  }, [open, requestId]);

  const loadRequest = async () => {
    if (!requestId) return;

    try {
      const { data, error } = await supabase
        .from('diligence_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) throw error;
      setRequest(data);
      setSelectedUserId(data.assigned_to || '');
    } catch (error) {
      console.error('Error loading request:', error);
    }
  };

  const handleAssign = async () => {
    if (!requestId) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('diligence_requests')
        .update({ 
          assigned_to: selectedUserId || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: selectedUserId 
          ? "Request assigned successfully" 
          : "Request unassigned successfully",
      });

      onAssignmentComplete();
      onOpenChange(false);
    } catch (error) {
      console.error('Error assigning request:', error);
      toast({
        title: "Error",
        description: "Failed to assign request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Request</DialogTitle>
          <DialogDescription>
            Assign this request to a user or leave unassigned
          </DialogDescription>
        </DialogHeader>

        {request && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">{request.title}</h4>
              <p className="text-sm text-gray-600">{request.description}</p>
            </div>

            <div>
              <label className="text-sm font-medium">Assign to:</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select a user or leave unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssign} disabled={loading}>
                {loading ? 'Assigning...' : 'Assign'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
