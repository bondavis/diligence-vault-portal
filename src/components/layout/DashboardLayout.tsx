
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">M&A Diligence Portal</h1>
            <p className="text-sm text-slate-600">Deal Management & Document Repository</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm">
              <UserIcon className="h-4 w-4" />
              <span className="font-medium">{user.name}</span>
              <span className="px-2 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-600">
                {user.role.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="flex items-center space-x-2"
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
