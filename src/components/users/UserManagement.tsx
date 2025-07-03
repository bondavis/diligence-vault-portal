
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Mail, Shield, Users, Building } from 'lucide-react';
import { User, UserRole } from '@/pages/Index';

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

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'bbt_execution_team': return 'bg-red-100 text-red-800';
      case 'bbt_operations':
      case 'bbt_finance':
      case 'bbt_legal':
      case 'bbt_exec': return 'bg-blue-100 text-blue-800';
      case 'seller':
      case 'seller_legal':
      case 'seller_financial': return 'bg-green-100 text-green-800';
      case 'rsm': return 'bg-purple-100 text-purple-800';
      case 'hensen_efron': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    if (role === 'bbt_execution_team') return <Shield className="h-3 w-3" />;
    if (role.startsWith('bbt_')) return <Building className="h-3 w-3" />;
    if (role.startsWith('seller')) return <Users className="h-3 w-3" />;
    return <Mail className="h-3 w-3" />;
  };

  const getRoleDisplayName = (role: UserRole): string => {
    const roleMap: Record<UserRole, string> = {
      bbt_execution_team: 'BBT Execution Team',
      bbt_operations: 'BBT Operations',
      bbt_finance: 'BBT Finance',
      bbt_legal: 'BBT Legal',
      bbt_exec: 'BBT Executive',
      seller: 'Seller',
      seller_legal: 'Seller Legal',
      seller_financial: 'Seller Financial',
      rsm: 'RSM',
      hensen_efron: 'Hensen & Efron'
    };
    return roleMap[role] || role;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user access and permissions across all deals</CardDescription>
            </div>
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
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={orgFilter} onValueChange={setOrgFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by org" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Organizations</SelectItem>
                <SelectItem value="BBT">BBT</SelectItem>
                <SelectItem value="Seller">Seller</SelectItem>
                <SelectItem value="RSM">RSM</SelectItem>
                <SelectItem value="Hensen & Efron">Hensen & Efron</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="bbt_execution_team">BBT Execution Team</SelectItem>
                <SelectItem value="bbt_operations">BBT Operations</SelectItem>
                <SelectItem value="bbt_finance">BBT Finance</SelectItem>
                <SelectItem value="bbt_legal">BBT Legal</SelectItem>
                <SelectItem value="bbt_exec">BBT Executive</SelectItem>
                <SelectItem value="seller">Seller</SelectItem>
                <SelectItem value="seller_legal">Seller Legal</SelectItem>
                <SelectItem value="seller_financial">Seller Financial</SelectItem>
                <SelectItem value="rsm">RSM</SelectItem>
                <SelectItem value="hensen_efron">Hensen & Efron</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Assigned Deal</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-medium">
                        {user.organization}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getRoleColor(user.role)}>
                        <div className="flex items-center space-x-1">
                          {getRoleIcon(user.role)}
                          <span>{getRoleDisplayName(user.role)}</span>
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.dealName ? (
                        <div className="text-sm">
                          <div className="font-medium">{user.dealName}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">All Deals</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(user.lastActive).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="outline" size="sm">Remove</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

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
