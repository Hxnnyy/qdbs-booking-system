import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Profile, UpdatableProfile } from '@/supabase-types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: any) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: UpdatableProfile) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setIsLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for userId:', userId);
      
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError.message);
        setIsLoading(false);
        return;
      }

      console.log('Profile data received:', data);
      
      if (data) {
        setProfile(data);
        setIsAdmin(!!data.is_admin);
        setIsSuperAdmin(!!data.is_super_admin);
        
        console.log('Is admin set to:', !!data.is_admin);
        console.log('Is super admin set to:', !!data.is_super_admin);
      } else {
        console.log('No profile found for user, creating one');
        await createInitialProfile(userId);
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const createInitialProfile = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .insert({ id: userId })
        .select();
      
      if (error) throw error;
      
      await fetchProfile(userId);
    } catch (error: any) {
      console.error('Error creating profile:', error.message);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const updateProfile = async (data: UpdatableProfile) => {
    try {
      if (!user) throw new Error('No user logged in');
      
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);
      
      if (error) throw error;
      
      await refreshProfile();
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      toast.success('Password reset instructions sent to your email');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      if (!user) throw new Error('No user logged in');
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email as string,
        password: currentPassword,
      });
      
      if (signInError) throw new Error('Current password is incorrect');
      
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) throw error;
      
      toast.success('Password updated successfully');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const deleteAccount = async () => {
    try {
      if (!user) throw new Error('No user logged in');
      
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);
        
      if (profileError) throw profileError;
      
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (authError) throw authError;
      
      await supabase.auth.signOut();
      
      toast.success('Your account has been deleted');
      navigate('/');
    } catch (error: any) {
      toast.error(`Failed to delete account: ${error.message}`);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate('/');
      toast.success('Logged in successfully');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      // First, register the user with Supabase authentication
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            phone: userData.phone, // Store phone in user metadata
          },
        },
      });
      
      if (error) throw error;
      
      // After signup is successful, get the newly created user
      const { data: currentUser } = await supabase.auth.getUser();
      
      if (currentUser?.user) {
        // Ensure the profile exists with complete information including phone number
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: currentUser.user.id,
          first_name: userData.firstName,
          last_name: userData.lastName,
          email: email,
          phone: userData.phone, // Explicitly add phone to profile
        }, { onConflict: 'id' });
        
        if (profileError) {
          console.error('Error updating profile with phone number:', profileError);
          // Still proceed with signup but log the error
        }
      }
      
      toast.success('Account created! Please check your email for verification.');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/');
      toast.success('Logged out successfully');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isLoading,
        signIn,
        signUp,
        signOut,
        isAdmin,
        isSuperAdmin,
        refreshProfile,
        updateProfile,
        resetPassword,
        updatePassword,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
