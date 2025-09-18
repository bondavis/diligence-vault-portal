
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export type UserRole = 
  | 'bbt_execution_team'
  | 'bbt_operations' 
  | 'bbt_finance'
  | 'bbt_legal'
  | 'bbt_exec'
  | 'seller'
  | 'seller_legal'
  | 'seller_financial'
  | 'rsm'
  | 'hensen_efron'
  | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organization?: string;
  dealId?: string;
}

const Index = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  console.log('Index component state:', { user: !!user, profile: !!profile, loading });

  useEffect(() => {
    console.log('Index useEffect triggered:', { loading, user: !!user });
    // No authentication required - everyone gets admin access
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary mx-auto"></div>
            <div className="absolute inset-0 rounded-full bg-primary/5 animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-foreground">Loading Dashboard</p>
            <p className="text-sm text-muted-foreground">Setting up your workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null; // No redirect needed, everyone gets admin access
  }

  const currentUser: User = {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role as UserRole,
    organization: profile.organization,
    dealId: profile.deal_id || undefined,
  };

  return <DashboardLayout user={currentUser} />;
};

export default Index;
