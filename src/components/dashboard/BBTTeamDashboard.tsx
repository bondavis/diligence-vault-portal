
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, Users } from 'lucide-react';
import { User } from '@/pages/Index';
import { DealManagement } from './DealManagement';
import { getRoleDisplayName } from '@/components/users/utils/roleUtils';

interface BBTTeamDashboardProps {
  user: User;
}

export const BBTTeamDashboard = ({ user }: BBTTeamDashboardProps) => {
  const getTeamDescription = (role: string) => {
    switch (role) {
      case 'bbt_operations':
        return 'Operations team access - monitor deal progress and operational metrics';
      case 'bbt_finance':
        return 'Finance team access - review financial documents and metrics';
      case 'bbt_legal':
        return 'Legal team access - review legal documents and compliance';
      case 'bbt_exec':
        return 'Executive team access - high-level deal oversight and reporting';
      default:
        return 'BBT team member access';
    }
  };

  return (
    <div className="space-y-6">
      {/* BBT Team Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center space-x-2">
                <Users className="h-6 w-6" />
                <span>{getRoleDisplayName(user.role)} Dashboard</span>
              </CardTitle>
              <CardDescription className="text-blue-100">
                {getTeamDescription(user.role)}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Navigation */}
      <Tabs defaultValue="deals" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="deals">Active Deals</TabsTrigger>
        </TabsList>

        <TabsContent value="deals">
          <DealManagement user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
