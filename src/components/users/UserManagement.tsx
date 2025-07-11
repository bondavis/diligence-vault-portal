
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserFilters } from './UserFilters';
import { UsersTable } from './UsersTable';
import { UserActions } from './UserActions';
import { EditUserModal } from './EditUserModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface UserWithDeal {
  id: string;
  name: string;
  email: string;
  role: string;
  organization: string | null;
  invitation_status: string | null;
  last_active: string | null;
  dealName?: string;
  dealId?: string;
}

export const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [orgFilter, setOrgFilter] = useState<string>('all');
  const [users, setUsers] = useState<UserWithDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserWithDeal | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const { toast } = useToast();

  // Load users from database
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          role,
          organization,
          invitation_status,
          last_active
        `)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get user deal assignments
      const { data: userDealsData, error: userDealsError } = await supabase
        .from('user_deals')
        .select(`
          user_id,
          deal_id,
          deals (
            id,
            name,
            company_name
          )
        `);

      if (userDealsError) throw userDealsError;

      // Merge user data with deal assignments
      const usersWithDeals: UserWithDeal[] = profilesData.map(profile => {
        const userDeal = userDealsData.find(ud => ud.user_id === profile.id);
        const deal = userDeal?.deals as any;
        
        return {
          ...profile,
          dealName: deal ? `${deal.name} (${deal.company_name})` : undefined,
          dealId: deal?.id,
        };
      });

      setUsers(usersWithDeals);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleEditUser = (user: UserWithDeal) => {
    setEditingUser(user);
    setEditModalOpen(true);
  };

  const handleRemoveUser = async (user: UserWithDeal) => {
    if (!confirm(`Are you sure you want to remove ${user.name}? This will deactivate their account.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ invitation_status: 'inactive' })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "User Removed",
        description: `${user.name} has been deactivated.`,
      });

      loadUsers(); // Refresh the list
    } catch (error) {
      console.error('Error removing user:', error);
      toast({
        title: "Error",
        description: "Failed to remove user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesOrg = orgFilter === 'all' || user.organization === orgFilter;
    return matchesSearch && matchesRole && matchesOrg;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user access and permissions across all deals</CardDescription>
            </div>
            <UserActions onUserInvited={loadUsers} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <UserFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            roleFilter={roleFilter}
            onRoleFilterChange={setRoleFilter}
            orgFilter={orgFilter}
            onOrgFilterChange={setOrgFilter}
          />

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading users...</span>
            </div>
          ) : (
            <>
              <UsersTable 
                users={filteredUsers} 
                onEditUser={handleEditUser}
                onRemoveUser={handleRemoveUser}
              />

              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No users found matching your search criteria.
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <EditUserModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        user={editingUser}
        onUserUpdated={loadUsers}
      />
    </div>
  );
};
