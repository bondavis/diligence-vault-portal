
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Users, FileText, TrendingUp, Plus } from 'lucide-react';
import { User } from '@/pages/Index';
import { DealsOverview } from '@/components/deals/DealsOverview';
import { UserManagement } from '@/components/users/UserManagement';

interface AdminDashboardProps {
  user: User;
}

export const AdminDashboard = ({ user }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for demonstration
  const stats = {
    totalDeals: 3,
    activeDeals: 2,
    totalUsers: 12,
    pendingRequests: 47
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section with Big Brand Tire styling */}
      <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-l-bb-red">
        <h2 className="text-2xl font-bold text-bb-dark-gray">Welcome back, {user.name}</h2>
        <p className="text-gray-600">Manage deals, users, and monitor diligence progress across your portfolio.</p>
      </div>

      {/* Key Metrics with Big Brand Tire colors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-bb-red">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-bb-dark-gray">Total Deals</CardTitle>
            <Building2 className="h-4 w-4 text-bb-red" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-bb-dark-gray">{stats.totalDeals}</div>
            <p className="text-xs text-gray-600">
              +1 from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-bb-blue">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-bb-dark-gray">Active Users</CardTitle>
            <Users className="h-4 w-4 text-bb-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-bb-blue">{stats.totalUsers}</div>
            <p className="text-xs text-gray-600">
              +3 from last week
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-bb-dark-gray">Pending Requests</CardTitle>
            <FileText className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pendingRequests}</div>
            <p className="text-xs text-gray-600">
              -12 from yesterday
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-bb-dark-gray">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">73%</div>
            <p className="text-xs text-gray-600">
              +5% from last week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs with Big Brand Tire styling */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-white border border-gray-200">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-bb-red data-[state=active]:text-white"
          >
            Deals Overview
          </TabsTrigger>
          <TabsTrigger 
            value="users"
            className="data-[state=active]:bg-bb-red data-[state=active]:text-white"
          >
            User Management
          </TabsTrigger>
          <TabsTrigger 
            value="analytics"
            className="data-[state=active]:bg-bb-red data-[state=active]:text-white"
          >
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <DealsOverview />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UserManagement />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-bb-dark-gray">Analytics Dashboard</CardTitle>
              <CardDescription>Coming soon - Advanced analytics and reporting</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-40 flex items-center justify-center text-gray-500">
                Analytics dashboard will be implemented here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
