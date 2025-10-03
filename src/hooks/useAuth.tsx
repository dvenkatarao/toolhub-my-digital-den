import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isPremium: boolean;
  subscriptionEnd: string | null;
  checkSubscription: () => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const { toast } = useToast();

  const checkSubscription = async () => {
    if (!session) {
      console.log('[AUTH] No session, setting premium to false');
      setIsPremium(false);
      setSubscriptionEnd(null);
      return;
    }

    try {
      console.log('[AUTH] Checking subscription for user:', session.user.email);
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('[AUTH] Subscription check error:', error);
        throw error;
      }

      console.log('[AUTH] Subscription check result:', data);
      const isSubscribed = data?.subscribed === true;
      setIsPremium(isSubscribed);
      setSubscriptionEnd(data?.subscription_end || null);
      console.log('[AUTH] Premium status updated to:', isSubscribed);
    } catch (error) {
      console.error('[AUTH] Error checking subscription:', error);
      // Don't reset premium status on error - keep current state
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('[AUTH] Auth state changed:', event, currentSession?.user?.email);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
        
        // Check subscription status after auth change with a delay for session to stabilize
        if (currentSession) {
          setTimeout(async () => {
            try {
              console.log('[AUTH] Checking subscription after auth change');
              const { data, error } = await supabase.functions.invoke('check-subscription', {
                headers: {
                  Authorization: `Bearer ${currentSession.access_token}`,
                },
              });

              if (error) {
                console.error('[AUTH] Subscription check error:', error);
                return;
              }

              console.log('[AUTH] Subscription check result:', data);
              const isSubscribed = data?.subscribed === true;
              setIsPremium(isSubscribed);
              setSubscriptionEnd(data?.subscription_end || null);
              console.log('[AUTH] Premium status updated to:', isSubscribed);
            } catch (error) {
              console.error('[AUTH] Error checking subscription:', error);
            }
          }, 500);
        } else {
          console.log('[AUTH] No session after auth change, clearing premium status');
          setIsPremium(false);
          setSubscriptionEnd(null);
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      console.log('[AUTH] Initial session loaded:', initialSession?.user?.email);
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);
      
      if (initialSession) {
        setTimeout(async () => {
          try {
            console.log('[AUTH] Checking subscription on initial load');
            const { data, error } = await supabase.functions.invoke('check-subscription', {
              headers: {
                Authorization: `Bearer ${initialSession.access_token}`,
              },
            });

            if (error) {
              console.error('[AUTH] Subscription check error:', error);
              return;
            }

            console.log('[AUTH] Subscription check result:', data);
            const isSubscribed = data?.subscribed === true;
            setIsPremium(isSubscribed);
            setSubscriptionEnd(data?.subscription_end || null);
            console.log('[AUTH] Premium status updated to:', isSubscribed);
          } catch (error) {
            console.error('[AUTH] Error checking subscription:', error);
          }
        }, 500);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Check your email",
        description: "We've sent you a confirmation link.",
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    }

    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    return { error };
  };

  const value = {
    user,
    session,
    loading,
    isPremium,
    subscriptionEnd,
    checkSubscription,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};