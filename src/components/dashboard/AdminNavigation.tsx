
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DealManagement } from './DealManagement';
import { TemplateManager } from '@/components/templates/TemplateManager';
import { UserManagement } from '@/components/users/UserManagement';
import { User } from '@/pages/Index';

interface AdminNavigationProps {
  user: User;
}

export const AdminNavigation = ({ user }: AdminNavigationProps) => {
  // Admin and BBT Execution Team can manage users and templates
  const canManageUsers = user.role === 'bbt_execution_team' || user.role === 'admin';
  const canManageTemplates = user.role === 'bbt_execution_team' || user.role === 'admin';
  
  // All BBT roles and admin can view deals
  const canViewDeals = user.role.startsWith('bbt_') || user.role === 'rsm' || user.role === 'hensen_efron' || user.role === 'admin';

  return (
    <Tabs defaultValue="deals" className="space-y-6">
      <TabsList className={`grid w-full ${canManageUsers ? 'grid-cols-3' : canManageTemplates ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {canViewDeals && <TabsTrigger value="deals">Deals</TabsTrigger>}
        {canManageTemplates && <TabsTrigger value="templates">Request Templates</TabsTrigger>}
        {canManageUsers && <TabsTrigger value="users">Users</TabsTrigger>}
      </TabsList>

      {canViewDeals && (
        <TabsContent value="deals">
          <DealManagement user={user} />
        </TabsContent>
      )}

      {canManageTemplates && (
        <TabsContent value="templates">
          <TemplateManager />
        </TabsContent>
      )}

      {canManageUsers && (
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
      )}
    </Tabs>
  );
};
