
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from '@/pages/Index';
import { AdminNavigation } from './AdminNavigation';

interface AdminDashboardProps {
  user: User;
}

export const AdminDashboard = ({ user }: AdminDashboardProps) => {
  return (
    <div className="space-y-6">
      {/* Big Brand Tire Admin Header */}
      <Card className="bg-gradient-to-r from-bb-red to-red-600 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
              <CardDescription className="text-red-100">
                Manage deals, templates, and users
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Navigation */}
      <AdminNavigation user={user} />
    </div>
  );
};
