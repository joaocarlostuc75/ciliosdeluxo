import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { User as StudioProfile } from '../types';

interface AuthContextType {
  user: any | null;
  studioProfile: StudioProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  retry: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [studioProfile, setStudioProfile] = useState<StudioProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const initializationStarted = useRef(false);
  const [retryCount, setRetryCount] = useState(0);

  const fetchProfile = async (userId: string): Promise<StudioProfile | null> => {
    console.log(`AuthContext: Fetching profile for ${userId}...`);

    // Create a promise that rejects after a timeout
    const timeoutPromise = new Promise<null>((_, reject) => {
      setTimeout(() => reject(new Error('Profile fetch timed out (5s)')), 5000);
    });

    try {
      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) {
        console.warn('AuthContext: Profile fetch returned error', error);
        return null;
      }

      if (data) {
        console.log('AuthContext: Profile successfully loaded');
        return {
          id: data.id,
          name: data.name,
          ownerName: data.owner_name,
          whatsapp: data.whatsapp,
          address: data.address,
          email: data.email,
          history: data.history,
          mission: data.mission,
          image: data.avatar_url,
          businessHours: [],
          blocks: []
        };
      }
      return null;
    } catch (err) {
      console.error('AuthContext: Error in fetchProfile', err);
      return null;
    }
  };

  const initializeAuth = async () => {
    if (initializationStarted.current && retryCount === 0) return;
    initializationStarted.current = true;

    console.log('AuthContext: Starting initialization flow...');
    setLoading(true);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const profile = await fetchProfile(currentUser.id);
        setStudioProfile(profile);
      } else {
        setStudioProfile(null);
      }
    } catch (err) {
      console.error('AuthContext: Unexpected error during initializeAuth', err);
    } finally {
      setLoading(false);
      console.log('AuthContext: Initialization flow complete');
    }
  };

  useEffect(() => {
    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthContext: onAuthStateChange event:', event);

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
        if (currentUser) {
          const profile = await fetchProfile(currentUser.id);
          setStudioProfile(profile);
        }
      } else if (event === 'SIGNED_OUT') {
        setStudioProfile(null);
      }

      // If state change happens, we are definitely not loading the initial setup anymore
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [retryCount]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setStudioProfile(null);
  };

  const retry = () => {
    console.log('AuthContext: Manual retry triggered');
    setRetryCount(prev => prev + 1);
  };

  return (
    <AuthContext.Provider value={{ user, studioProfile, loading, signOut, retry }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
