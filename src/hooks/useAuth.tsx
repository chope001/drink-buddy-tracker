import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const redeemPendingInvite = async (currentUser: User | null) => {
      if (!currentUser) return;
      const token = localStorage.getItem('pendingInviteToken');
      if (!token) return;
      // Clear immediately to prevent re-redemption loops
      localStorage.removeItem('pendingInviteToken');
      const { data, error } = await supabase.rpc('redeem_invite', { _token: token });
      if (!error && data) {
        // Defer navigation so React state settles first
        setTimeout(() => {
          window.location.assign(`/groups/${data}`);
        }, 0);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (event === 'SIGNED_IN') {
        redeemPendingInvite(session?.user ?? null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      // Also try on initial load (handles OAuth redirect-back where SIGNED_IN may have already fired)
      redeemPendingInvite(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
