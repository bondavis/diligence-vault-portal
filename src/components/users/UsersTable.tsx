
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getRoleColor, getRoleIcon, getRoleDisplayName } from './utils/roleUtils';

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

interface UsersTableProps {
  users: UserWithDeal[];
  onEditUser: (user: UserWithDeal) => void;
  onRemoveUser: (user: UserWithDeal) => void;
  onReactivateUser: (user: UserWithDeal) => void;
}

export const UsersTable = ({ users, onEditUser, onRemoveUser, onReactivateUser }: UsersTableProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assigned Deal</TableHead>
            <TableHead>Last Active</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map(user => {
            const RoleIcon = getRoleIcon(user.role);
            const getStatusBadge = (status: string | null) => {
              switch (status) {
                case 'pending':
                  return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>;
                case 'active':
                  return <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>;
                case 'inactive':
                  return <Badge variant="outline" className="text-red-600 border-red-600">Inactive</Badge>;
                default:
                  return <Badge variant="outline">Unknown</Badge>;
              }
            };

            return (
              <TableRow key={user.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-medium">
                    {user.organization || 'No Organization'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getRoleColor(user.role)}>
                    <div className="flex items-center space-x-1">
                      <RoleIcon className="h-3 w-3" />
                      <span>{getRoleDisplayName(user.role)}</span>
                    </div>
                  </Badge>
                </TableCell>
                <TableCell>
                  {getStatusBadge(user.invitation_status)}
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
                    {user.last_active ? new Date(user.last_active).toLocaleDateString() : 'Never'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => onEditUser(user)}>Edit</Button>
                    {user.invitation_status === 'inactive' ? (
                      <Button variant="outline" size="sm" onClick={() => onReactivateUser(user)} className="text-green-600 hover:text-green-700">
                        Reactivate
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => onRemoveUser(user)} className="text-red-600 hover:text-red-700">
                        Deactivate
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
