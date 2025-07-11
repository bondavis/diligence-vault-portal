
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
  
  console.log('useAuth state:', { user: !!user, session: !!session, profile: !!profile, loading });

  useEffect(() => {
    console.log('Setting up auth state listener');
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        console.log('Setting session and user from auth state change');
        setSession(session);
        setUser(session?.user ?? null);
        
        // Set loading to false IMMEDIATELY to unblock the UI
        console.log('Setting loading to false FIRST');
        setLoading(false);

        // Log authentication events (don't block on this)
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in, logging audit event');
          auditLogger.logLogin().catch(console.error); // Don't await, don't block
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out, logging audit event');
          auditLogger.logLogout().catch(console.error); // Don't await, don't block
        }
        
        if (session?.user) {
          console.log('User exists, fetching profile with setTimeout');
          // Fetch user profile with a small delay to avoid deadlock
          setTimeout(async () => {
            try {
              console.log('Starting profile fetch for user:', session.user.id);
              const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              console.log('Profile fetch result:', { profileData, error });
              
              if (error && error.code !== 'PGRST116') {
                console.error('Error fetching profile:', error);
                // Security fix: Default to most restrictive role when profile unavailable
                const restrictedProfile: Profile = {
                  id: session.user.id,
                  email: session.user.email || '',
                  name: session.user.email?.split('@')[0] || 'User',
                  role: 'seller', // Default to most restrictive role for security
                  created_at: new Date().toISOString(),
                };
                console.log('Setting restricted profile:', restrictedProfile);
                setProfile(restrictedProfile);
              } else if (profileData) {
                // Type cast the profile data to ensure it matches our interface
                const typedProfile: Profile = {
                  id: profileData.id,
                  email: profileData.email,
                  name: profileData.name,
                  role: (profileData.role as Profile['role']) || 'seller',
                  organization: profileData.organization || undefined,
                  deal_id: profileData.deal_id || undefined,
                  created_at: profileData.created_at,
                  last_active: profileData.last_active || undefined,
                  invitation_status: profileData.invitation_status || undefined,
                  invited_at: profileData.invited_at || undefined,
                  invited_by: profileData.invited_by || undefined,
                };
                console.log('Profile loaded:', typedProfile);
                setProfile(typedProfile);
              }
            } catch (error) {
              console.error('Error in profile fetch:', error);
              // Security fix: Fallback to most restrictive role
              const fallbackProfile: Profile = {
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.email?.split('@')[0] || 'User',
                role: 'seller', // Default to most restrictive role for security
                created_at: new Date().toISOString(),
              };
              console.log('Setting fallback profile:', fallbackProfile);
              setProfile(fallbackProfile);
            }
          }, 100);
        } else {
          console.log('No user, clearing profile');
          setProfile(null);
        }
      }
    );

    // Check for existing session on mount
    console.log('Checking for existing session on mount');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check result:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      console.log('Setting loading to false after initial session check');
      setLoading(false); // Always set loading to false after initial check
    });

    return () => {
      console.log('Cleaning up auth subscription');
      subscription.unsubscribe();
    };
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
