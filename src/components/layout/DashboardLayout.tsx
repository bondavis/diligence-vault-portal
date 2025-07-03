
import { useState } from 'react';
import { User, UserRole } from '@/pages/Index';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { UserDashboard } from '@/components/dashboard/UserDashboard';
import { ViewAsToggle } from '@/components/admin/ViewAsToggle';
import { Button } from '@/components/ui/button';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface DashboardLayoutProps {
  user: User;
}

export const DashboardLayout = ({ user }: DashboardLayoutProps) => {
  const { signOut } = useAuth();
  const [viewAsRole, setViewAsRole] = useState<UserRole>(user.role);

  const handleLogout = async () => {
    await signOut();
  };

  // Helper function to get role display name
  const getRoleDisplayName = (role: UserRole): string => {
    const roleMap: Record<UserRole, string> = {
      bbt_execution_team: 'BBT Execution Team',
      bbt_operations: 'BBT Operations',
      bbt_finance: 'BBT Finance',
      bbt_legal: 'BBT Legal',
      bbt_exec: 'BBT Executive',
      seller: 'Seller',
      seller_legal: 'Seller Legal',
      seller_financial: 'Seller Financial',
      rsm: 'RSM',
      hensen_efron: 'Hensen & Efron'
    };
    return roleMap[role] || role;
  };

  // Create a modified user object for "view as" functionality
  const effectiveUser: User = {
    ...user,
    role: user.role === 'bbt_execution_team' ? viewAsRole : user.role
  };

  // Determine if user should see admin dashboard - BBT roles get admin access
  const isAdminUser = user.role === 'bbt_execution_team';
  const isBBTUser = user.role.startsWith('bbt_') || user.role === 'rsm' || user.role === 'hensen_efron';
  const shouldShowAdminDashboard = effectiveUser.role === 'bbt_execution_team' || 
    (effectiveUser.role.startsWith('bbt_') && viewAsRole === user.role);

  console.log('Dashboard Layout - User role:', user.role, 'Should show admin:', shouldShowAdminDashboard, 'Is BBT user:', isBBTUser);

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
          {/* Admin View As Toggle - only show for BBT Execution Team */}
          {isAdminUser && (
            <ViewAsToggle 
              currentRole={viewAsRole}
              onRoleChange={setViewAsRole}
            />
          )}

          {/* Dashboard Content - prioritize admin dashboard for BBT users */}
          {(shouldShowAdminDashboard || isBBTUser) ? (
            <AdminDashboard user={effectiveUser} />
          ) : (
            <UserDashboard user={effectiveUser} />
          )}
        </div>
      </main>
    </div>
  );
};
