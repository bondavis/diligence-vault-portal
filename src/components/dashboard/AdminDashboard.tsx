
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from '@/pages/Index';
import { AdminNavigation } from './AdminNavigation';

interface AdminDashboardProps {
  user: User;
}

export const AdminDashboard = ({ user }: AdminDashboardProps) => {
  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <Card className="bg-card border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-foreground">Admin Dashboard</CardTitle>
              <CardDescription className="text-muted-foreground">
                {user.role === 'bbt_execution_team' 
                  ? 'Full administrative access - manage deals, templates, and users'
                  : 'Administrative access for BBT team members'
                }
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
