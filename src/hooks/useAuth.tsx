
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  email: string;
  name: string;
  role: 'bbt_execution_team' | 'bbt_operations' | 'bbt_finance' | 'bbt_legal' | 'bbt_exec' | 'seller' | 'seller_legal' | 'seller_financial' | 'rsm' | 'hensen_efron' | 'admin';
  organization?: string;
  deal_id?: string;
  created_at: string;
  last_active?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile with a small delay to avoid deadlock
          setTimeout(async () => {
            try {
              const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              if (error && error.code !== 'PGRST116') {
                console.error('Error fetching profile:', error);
                // Create default profile if none exists - use admin for testing
                const defaultProfile: Profile = {
                  id: session.user.id,
                  email: session.user.email || '',
                  name: session.user.email?.split('@')[0] || 'User',
                  role: 'admin', // Default to admin role for testing
                  created_at: new Date().toISOString(),
                };
                setProfile(defaultProfile);
              } else if (profileData) {
                // Type cast the profile data to ensure it matches our interface
                const typedProfile: Profile = {
                  id: profileData.id,
                  email: profileData.email,
                  name: profileData.name,
                  role: (profileData.role as Profile['role']) || 'admin',
                  organization: (profileData as any).organization || undefined,
                  deal_id: (profileData as any).deal_id || undefined,
                  created_at: profileData.created_at,
                  last_active: (profileData as any).last_active || undefined
                };
                console.log('Profile loaded:', typedProfile);
                setProfile(typedProfile);
              }
            } catch (error) {
              console.error('Error in profile fetch:', error);
              // Fallback profile with admin role
              const fallbackProfile: Profile = {
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.email?.split('@')[0] || 'User',
                role: 'admin',
                created_at: new Date().toISOString(),
              };
              setProfile(fallbackProfile);
            }
          }, 100);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
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
