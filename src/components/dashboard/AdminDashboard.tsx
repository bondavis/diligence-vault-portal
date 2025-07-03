import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Building, FileText, TrendingUp } from 'lucide-react';
import { User } from '@/pages/Index';
import { UserManagement } from '@/components/users/UserManagement';
import { DealsOverview } from '@/components/deals/DealsOverview';
import { DiligenceRequestUpload } from '@/components/upload/DiligenceRequestUpload';

interface AdminDashboardProps {
  user: User;
}

export const AdminDashboard = ({ user }: AdminDashboardProps) => {
  const dealInfo = {
    dealName: 'TechCorp Acquisition',
    dealCode: 'TECH-2024-001',
    targetClose: '2024-08-15',
    overallProgress: 67
  };

  const taskStats = {
    total: 24,
    completed: 16,
    pending: 6,
    overdue: 2
  };

  return (
    <div className="space-y-6">
      {/* Big Brand Tire Admin Header */}
      <Card className="bg-gradient-to-r from-bb-red to-red-600 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
              <CardDescription className="text-red-100">
                Manage users, deals, and diligence requests
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{dealInfo.overallProgress}%</div>
              <div className="text-sm text-red-100">Complete</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Admin Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-bb-red">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-bb-dark-gray">Total Users</CardTitle>
            <Users className="h-4 w-4 text-bb-red" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-bb-dark-gray">{taskStats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-bb-dark-gray">Active Deals</CardTitle>
            <Building className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-bb-dark-gray">Pending Requests</CardTitle>
            <FileText className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{taskStats.pending}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-bb-dark-gray">Overdue Tasks</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{taskStats.overdue}</div>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="deals">
          <DealsOverview />
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Diligence Requests Management</CardTitle>
              <CardDescription>View and manage all diligence requests across deals</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Request management interface coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload">
          <DiligenceRequestUpload onUploadComplete={() => {
            console.log('Upload completed - you may want to refresh other views');
          }} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
