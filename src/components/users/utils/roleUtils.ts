
import { UserRole } from '@/pages/Index';
import { Shield, Building, Users, Mail } from 'lucide-react';

export const getRoleColor = (role: UserRole): string => {
  switch (role) {
    case 'admin': return 'bg-purple-100 text-purple-800';
    case 'bbt_execution_team': return 'bg-red-100 text-red-800';
    case 'bbt_operations':
    case 'bbt_finance':
    case 'bbt_legal':
    case 'bbt_exec': return 'bg-blue-100 text-blue-800';
    case 'seller':
    case 'seller_legal':
    case 'seller_financial': return 'bg-green-100 text-green-800';
    case 'rsm': return 'bg-purple-100 text-purple-800';
    case 'hensen_efron': return 'bg-orange-100 text-orange-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getRoleIcon = (role: UserRole) => {
  if (role === 'admin' || role === 'bbt_execution_team') return Shield;
  if (role.startsWith('bbt_')) return Building;
  if (role.startsWith('seller')) return Users;
  return Mail;
};

export const getRoleDisplayName = (role: UserRole): string => {
  const roleMap: Record<UserRole, string> = {
    admin: 'Admin',
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
