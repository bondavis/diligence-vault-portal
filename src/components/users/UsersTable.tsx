
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User } from '@/pages/Index';
import { getRoleColor, getRoleIcon, getRoleDisplayName } from './utils/roleUtils';

interface UsersTableProps {
  users: (User & { dealName?: string; lastActive: string })[];
}

export const UsersTable = ({ users }: UsersTableProps) => {
  return (
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
          {users.map(user => {
            const RoleIcon = getRoleIcon(user.role);
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
                    {user.organization}
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
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
