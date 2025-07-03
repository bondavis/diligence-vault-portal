
import { useState } from 'react';
import { User } from '@/pages/Index';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { UserDashboard } from '@/components/dashboard/UserDashboard';
import { Button } from '@/components/ui/button';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface DashboardLayoutProps {
  user: User;
}

export const DashboardLayout = ({ user }: DashboardLayoutProps) => {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

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
                {user.role.replace('_', ' ').toUpperCase()}
              </span>
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
        {user.role === 'admin' ? (
          <AdminDashboard user={user} />
        ) : (
          <UserDashboard user={user} />
        )}
      </main>
    </div>
  );
};
