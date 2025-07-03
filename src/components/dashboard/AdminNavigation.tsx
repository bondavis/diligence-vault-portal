
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DealManagement } from './DealManagement';
import { TemplateManager } from '@/components/templates/TemplateManager';
import { UserManagement } from '@/components/users/UserManagement';
import { User } from '@/pages/Index';

interface AdminNavigationProps {
  user: User;
}

export const AdminNavigation = ({ user }: AdminNavigationProps) => {
  return (
    <Tabs defaultValue="deals" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="deals">Deals</TabsTrigger>
        <TabsTrigger value="templates">Request Templates</TabsTrigger>
        <TabsTrigger value="users">Users</TabsTrigger>
      </TabsList>

      <TabsContent value="deals">
        <DealManagement user={user} />
      </TabsContent>

      <TabsContent value="templates">
        <TemplateManager />
      </TabsContent>

      <TabsContent value="users">
        <UserManagement />
      </TabsContent>
    </Tabs>
  );
};
