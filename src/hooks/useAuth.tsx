
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { auditLogger } from '@/utils/auditLogger';

interface Profile {
  id: string;
  email: string;
  name: string;
  role: 'bbt_execution_team' | 'bbt_operations' | 'bbt_finance' | 'bbt_legal' | 'bbt_exec' | 'seller' | 'seller_legal' | 'seller_financial' | 'rsm' | 'hensen_efron' | 'admin';
  organization?: string;
  deal_id?: string;
  created_at: string;
  last_active?: string;
  invitation_status?: string;
  invited_at?: string;
  invited_by?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Provide default admin access without authentication
    const defaultUser = {
      id: 'default-admin-user',
      email: 'admin@example.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as User;

    const defaultProfile: Profile = {
      id: 'default-admin-user',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
      created_at: new Date().toISOString()
    };

    setUser(defaultUser);
    setProfile(defaultProfile);
    setLoading(false);
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    user,
    session,
    profile,
    loading,
    signOut,
  };
};
