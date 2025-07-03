
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

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null; // Will redirect to auth
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
