import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface InviteSellerUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserInvited: () => void;
}

interface Deal {
  id: string;
  name: string;
  company_name: string;
}

const SELLER_ROLES = [
  { value: 'seller', label: 'Seller' },
  { value: 'seller_legal', label: 'Seller Legal' },
  { value: 'seller_financial', label: 'Seller Financial' },
];

export const InviteSellerUserModal = ({ open, onOpenChange, onUserInvited }: InviteSellerUserModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    dealId: '',
  });
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDeals, setIsLoadingDeals] = useState(false);
  const { toast } = useToast();

  // Load available deals
  useEffect(() => {
    if (open) {
      loadDeals();
    }
  }, [open]);

  const loadDeals = async () => {
    setIsLoadingDeals(true);
    try {
      const { data, error } = await supabase
        .from('deals')
        .select('id, name, company_name')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeals(data || []);
    } catch (error) {
      console.error('Error loading deals:', error);
      toast({
        title: "Error",
        description: "Failed to load deals. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDeals(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.role || !formData.dealId) {
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
          organization: 'Seller',
          invitation_status: 'pending',
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Assign user to the specific deal
      const { error: assignmentError } = await supabase
        .from('user_deals')
        .insert({
          user_id: profile.id,
          deal_id: formData.dealId,
          role_in_deal: 'participant',
          assigned_by: profile.id, // This should be the current admin user ID
        });

      if (assignmentError) throw assignmentError;

      // Get deal name for invitation email
      const selectedDeal = deals.find(deal => deal.id === formData.dealId);
      const dealName = selectedDeal ? `${selectedDeal.name} (${selectedDeal.company_name})` : 'Selected Deal';

      // Send invitation email
      try {
        await supabase.rpc('send_user_invitation', {
          user_email: formData.email,
          user_name: formData.name,
          deal_id: formData.dealId,
          deal_name: dealName,
          invited_by_email: 'admin@company.com', // This should come from current user
        });
      } catch (emailError) {
        console.warn('Email sending failed:', emailError);
        // Don't block the invitation process if email fails
      }

      toast({
        title: "User Invited",
        description: `${formData.name} has been invited as ${SELLER_ROLES.find(r => r.value === formData.role)?.label} for ${dealName}.`,
      });

      // Reset form
      setFormData({ name: '', email: '', role: '', dealId: '' });
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
          <DialogTitle>Invite Seller User</DialogTitle>
          <DialogDescription>
            Invite a seller user with access to a specific deal.
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
                {SELLER_ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deal">Assign to Deal *</Label>
            <Select 
              value={formData.dealId} 
              onValueChange={(value) => setFormData({ ...formData, dealId: value })}
              disabled={isLoadingDeals}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingDeals ? "Loading deals..." : "Select a deal"} />
              </SelectTrigger>
              <SelectContent>
                {deals.map((deal) => (
                  <SelectItem key={deal.id} value={deal.id}>
                    {deal.name} ({deal.company_name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isLoadingDeals || deals.length === 0}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};