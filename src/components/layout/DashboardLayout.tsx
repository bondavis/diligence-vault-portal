
import { useState } from 'react';
import { User, UserRole } from '@/pages/Index';
import { RoleBasedDashboard } from '@/components/dashboard/RoleBasedDashboard';
import { ViewAsToggle } from '@/components/admin/ViewAsToggle';
import { Button } from '@/components/ui/button';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getRoleDisplayName } from '@/components/users/utils/roleUtils';

interface DashboardLayoutProps {
  user: User;
}

export const DashboardLayout = ({ user }: DashboardLayoutProps) => {
  const { signOut } = useAuth();
  const [viewAsRole, setViewAsRole] = useState<UserRole>(user.role);

  const handleLogout = async () => {
    await signOut();
  };

  // Create a modified user object for "view as" functionality
  const effectiveUser: User = {
    ...user,
    role: (user.role === 'bbt_execution_team' || user.role === 'admin') ? viewAsRole : user.role
  };

  // Only admin and BBT Execution Team can use "view as" functionality
  const canViewAs = user.role === 'bbt_execution_team' || user.role === 'admin';

  console.log('Dashboard Layout - User role:', user.role, 'Effective role:', effectiveUser.role, 'Can view as:', canViewAs);

  return (
    <div className="min-h-screen bg-bb-light-gray">
      {/* Header with Big Brand Tire branding */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Big Brand Tire Logo */}
            <img 
              src="/lovable-uploads/0f099278-86ff-45fe-bd7d-12605ff603e6.png" 
              alt="Big Brand Tire & Service" 
              className="h-12 object-contain"
            />
            <div className="border-l border-gray-300 pl-4">
              <h1 className="text-xl font-bold text-bb-dark-gray">Diligence Portal</h1>
              <p className="text-sm text-gray-600">Deal Management & Document Repository</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm">
              <UserIcon className="h-4 w-4" />
              <span className="font-medium text-bb-dark-gray">{user.name}</span>
              <span className="px-2 py-1 bg-bb-red text-white rounded-full text-xs font-medium">
                {getRoleDisplayName(user.role)}
              </span>
              {user.organization && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                  {user.organization}
                </span>
              )}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="flex items-center space-x-2 border-bb-red text-bb-red hover:bg-bb-red hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="space-y-6">
          {/* Admin View As Toggle - show for admin and BBT Execution Team */}
          {canViewAs && (
            <ViewAsToggle 
              currentRole={viewAsRole}
              onRoleChange={setViewAsRole}
            />
          )}

          {/* Role-based Dashboard Content */}
          <RoleBasedDashboard user={effectiveUser} />
        </div>
      </main>
    </div>
  );
};
