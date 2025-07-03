
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, AlertTriangle, Upload, MessageSquare } from 'lucide-react';
import { User } from '@/pages/Index';
import { DiligenceRequestList } from '@/components/requests/DiligenceRequestList';

interface UserDashboardProps {
  user: User;
}

export const UserDashboard = ({ user }: UserDashboardProps) => {
  // Mock deal data
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
      {/* Deal Header with Big Brand Tire styling */}
      <Card className="bg-gradient-to-r from-bb-red to-red-600 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{dealInfo.dealName}</CardTitle>
              <CardDescription className="text-red-100">
                Deal Code: {dealInfo.dealCode} • Target Close: {new Date(dealInfo.targetClose).toLocaleDateString()}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{dealInfo.overallProgress}%</div>
              <div className="text-sm text-red-100">Complete</div>
            </div>
          </div>
          <div className="mt-4">
            <Progress value={dealInfo.overallProgress} className="bg-red-500" />
          </div>
        </CardHeader>
      </Card>

      {/* Task Summary with Big Brand Tire colors */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-bb-red">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-bb-dark-gray">Total Tasks</CardTitle>
            <MessageSquare className="h-4 w-4 text-bb-red" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-bb-dark-gray">{taskStats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-bb-dark-gray">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-bb-dark-gray">Pending</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{taskStats.pending}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-bb-dark-gray">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{taskStats.overdue}</div>
          </CardContent>
        </Card>
      </div>

      {/* Diligence Requests */}
      <DiligenceRequestList user={user} />
    </div>
  );
};
