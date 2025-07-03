import { User } from '@/pages/Index';
import { AdminDashboard } from './AdminDashboard';
import { UserDashboard } from './UserDashboard';
import { SellerDashboard } from './SellerDashboard';
import { BBTTeamDashboard } from './BBTTeamDashboard';
import { AffiliateTeamDashboard } from './AffiliateTeamDashboard';

interface RoleBasedDashboardProps {
  user: User;
}

export const RoleBasedDashboard = ({ user }: RoleBasedDashboardProps) => {
  // Admin and BBT Execution Team get full admin dashboard
  if (user.role === 'admin' || user.role === 'bbt_execution_team') {
    return <AdminDashboard user={user} />;
  }

  // Other BBT team members get BBT team dashboard
  if (user.role.startsWith('bbt_')) {
    return <BBTTeamDashboard user={user} />;
  }

  // Seller roles get seller dashboard
  if (user.role.startsWith('seller')) {
    return <SellerDashboard user={user} />;
  }

  // RSM and Hensen & Efron get affiliate team dashboard
  if (user.role === 'rsm' || user.role === 'hensen_efron') {
    return <AffiliateTeamDashboard user={user} />;
  }

  // Fallback to user dashboard
  return <UserDashboard user={user} />;
};
