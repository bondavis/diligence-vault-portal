
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, UserRole } from '@/pages/Index';
import { UserFilters } from './UserFilters';
import { UsersTable } from './UsersTable';
import { UserActions } from './UserActions';

export const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [orgFilter, setOrgFilter] = useState<string>('all');

  // Mock users data with new role structure
  const users: (User & { dealName?: string; lastActive: string })[] = [
    {
      id: '1',
      email: 'admin@bigbrandtire.com',
      name: 'Sarah Chen',
      role: 'bbt_execution_team',
      organization: 'BBT',
      lastActive: '2024-01-15'
    },
    {
      id: '2',
      email: 'operations@bigbrandtire.com',
      name: 'Michael Torres',
      role: 'bbt_operations',
      organization: 'BBT',
      lastActive: '2024-01-14'
    },
    {
      id: '3',
      email: 'legal@bigbrandtire.com',
      name: 'Jennifer Walsh',
      role: 'bbt_legal',
      organization: 'BBT',
      lastActive: '2024-01-13'
    },
    {
      id: '4',
      email: 'seller@techacq.com',
      name: 'David Kim',
      role: 'seller',
      organization: 'Seller',
      dealId: 'deal-1',
      dealName: 'TechCorp Acquisition',
      lastActive: '2024-01-12'
    },
    {
      id: '5',
      email: 'legal@sellercorp.com',
      name: 'Lisa Rodriguez',
      role: 'seller_legal',
      organization: 'Seller',
      dealId: 'deal-1',
      dealName: 'TechCorp Acquisition',
      lastActive: '2024-01-11'
    },
    {
      id: '6',
      email: 'analyst@rsm.com',
      name: 'Robert Johnson',
      role: 'rsm',
      organization: 'RSM',
      lastActive: '2024-01-10'
    },
    {
      id: '7',
      email: 'partner@hensen-efron.com',
      name: 'Amanda Clark',
      role: 'hensen_efron',
      organization: 'Hensen & Efron',
      lastActive: '2024-01-09'
    }
  ];

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
            <UserActions />
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

          <UsersTable users={filteredUsers} />

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No users found matching your search criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
