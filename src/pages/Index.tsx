
import { useState } from 'react';
import { Login } from '@/components/auth/Login';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export type UserRole = 'view_only' | 'upload_only' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  dealId?: string;
}

const Index = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} />;
  }

  return <DashboardLayout user={currentUser} onLogout={() => setCurrentUser(null)} />;
};

export default Index;
