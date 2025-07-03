
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Users } from 'lucide-react';
import { User } from '@/pages/Index';
import { DealManagement } from './DealManagement';
import { getRoleDisplayName } from '@/components/users/utils/roleUtils';

interface AffiliateTeamDashboardProps {
  user: User;
}

export const AffiliateTeamDashboard = ({ user }: AffiliateTeamDashboardProps) => {
  const getTeamDescription = (role: string) => {
    switch (role) {
      case 'rsm':
        return 'RSM team access - advisory and consulting services';
      case 'hensen_efron':
        return 'Hensen & Efron team access - legal advisory services';
      default:
        return 'Affiliate team member access';
    }
  };

  const getTeamColor = (role: string) => {
    switch (role) {
      case 'rsm':
        return 'from-purple-600 to-purple-700';
      case 'hensen_efron':
        return 'from-orange-600 to-orange-700';
      default:
        return 'from-gray-600 to-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Affiliate Team Header */}
      <Card className={`bg-gradient-to-r ${getTeamColor(user.role)} text-white`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center space-x-2">
                <Building2 className="h-6 w-6" />
                <span>{getRoleDisplayName(user.role)} Dashboard</span>
              </CardTitle>
              <CardDescription className="text-white/80">
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
