import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface InviteBBTUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserInvited: () => void;
}

const BBT_ROLES = [
  { value: 'bbt_execution_team', label: 'BBT Execution Team' },
  { value: 'bbt_operations', label: 'BBT Operations' },
  { value: 'bbt_legal', label: 'BBT Legal' },
  { value: 'bbt_finance', label: 'BBT Finance' },
  { value: 'bbt_exec', label: 'BBT Executive' },
  { value: 'rsm', label: 'RSM' },
  { value: 'hensen_efron', label: 'Hensen & Efron' },
];

const ORGANIZATIONS = {
  'bbt_execution_team': 'BBT',
  'bbt_operations': 'BBT',
  'bbt_legal': 'BBT',
  'bbt_finance': 'BBT',
  'bbt_exec': 'BBT',
  'rsm': 'RSM',
  'hensen_efron': 'Hensen & Efron',
};

export const InviteBBTUserModal = ({ open, onOpenChange, onUserInvited }: InviteBBTUserModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.role) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create user profile - we need to generate an ID
      const userId = crypto.randomUUID();
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          name: formData.name,
          email: formData.email,
          role: formData.role,
          organization: ORGANIZATIONS[formData.role as keyof typeof ORGANIZATIONS],
          invitation_status: 'pending',
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Send invitation email
      try {
        await supabase.rpc('send_user_invitation', {
          user_email: formData.email,
          user_name: formData.name,
          deal_id: null, // BBT users get global access
          deal_name: 'Portal Access',
          invited_by_email: 'admin@company.com', // This should come from current user
        });
      } catch (emailError) {
        console.warn('Email sending failed:', emailError);
        // Don't block the invitation process if email fails
      }

      toast({
        title: "User Invited",
        description: `${formData.name} has been invited as ${BBT_ROLES.find(r => r.value === formData.role)?.label}.`,
      });

      // Reset form
      setFormData({ name: '', email: '', role: '' });
      onOpenChange(false);
      onUserInvited();
    } catch (error: any) {
      console.error('Error inviting user:', error);
      toast({
        title: "Invitation Failed",
        description: error.message || "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite BBT/Affiliate User</DialogTitle>
          <DialogDescription>
            Invite a new BBT or affiliate user with access to all deals on the portal.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter email address"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {BBT_ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};