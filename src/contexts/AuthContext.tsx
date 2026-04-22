'use client';

/**
 * AUTHENTICATION CONTEXT
 * Provides global auth state management for the entire app.
 */
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAILS = ['pjvallabhaneni@gmail.com', 'pnelectronicsllc@gmail.com', 'dilanparikh28@gmail.com'];

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    isAdmin: boolean;
    userRole: 'admin' | 'user' | null;
    signUp: (email: string, password: string, fullName: string) => Promise<any>;
    signIn: (email: string, password: string) => Promise<any>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Custom hook for using authentication
 * Usage: const { user, signIn, signOut } = useAuth();
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);

    const isAdmin = userRole === 'admin' || (user?.email ? ADMIN_EMAILS.includes(user.email) : false);

    const fetchUserRole = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('role')
                .eq('id', userId)
                .single();
            if (!error && data) {
                setUserRole(data.role as 'admin' | 'user');
            }
        } catch (err) {
            console.error('Error fetching user role:', err);
        }
    };

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('Error getting session:', error);
                    if (error.message.includes('refresh_token_not_found') ||
                        error.message.includes('Invalid Refresh Token')) {
                        console.log('Clearing invalid session...');
                        await supabase.auth.signOut();
                    }
                } else {
                    setSession(session);
                    setUser(session?.user ?? null);
                    if (session?.user) {
                        await fetchUserRole(session.user.id);
                    }
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
                try {
                    await supabase.auth.signOut();
                } catch (signOutError) {
                    console.error('Error signing out during error recovery:', signOutError);
                }
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('Auth state changed:', event);

                if (event === 'TOKEN_REFRESHED' && !session) {
                    console.log('Token refresh failed, clearing session...');
                    setSession(null);
                    setUser(null);
                } else {
                    setSession(session);
                    setUser(session?.user ?? null);
                    if (session?.user) {
                        fetchUserRole(session.user.id);
                    } else {
                        setUserRole(null);
                    }
                }
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const signUp = async (email: string, password: string, fullName: string) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            });

            if (error) {
                console.error('Sign up error:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Error in signUp:', error);
            throw error;
        }
    };

    const signIn = async (email: string, password: string) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                console.error('Sign in error:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Error in signIn:', error);
            throw error;
        }
    };

    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('Sign out error:', error);
                throw error;
            }
        } catch (error) {
            console.error('Error in signOut:', error);
            throw error;
        }
    };

    const resetPassword = async (email: string) => {
        try {
            const { data, error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) {
                console.error('Password reset error:', error);
                throw error;
            }
            return data;
        } catch (error) {
            console.error('Error in resetPassword:', error);
            throw error;
        }
    };

    const value = {
        user,
        session,
        loading,
        isAdmin,
        userRole,
        signUp,
        signIn,
        signOut,
        resetPassword,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
