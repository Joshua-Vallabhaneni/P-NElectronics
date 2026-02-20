/**
 * SUPABASE CLIENT CONFIGURATION
 * Creates and configures the Supabase client for the app.
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        'Missing Supabase environment variables. Please check your .env.local file.'
    );
}

/**
 * THE MAIN SUPABASE CLIENT
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});

/**
 * Create a new Supabase client instance
 */
export const createSupabaseClient = () => createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});

/**
 * Get the currently logged-in user
 */
export const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
        console.error('Error getting current user:', error);
        return null;
    }
    return user;
};

/**
 * Sign out the current user
 */
export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error signing out:', error);
        throw error;
    }
};

/**
 * Clear authentication storage and reset session
 */
export const clearAuthStorage = async () => {
    try {
        await supabase.auth.signOut();
        if (typeof window !== 'undefined') {
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('sb-')) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));

            const sessionKeysToRemove: string[] = [];
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && key.startsWith('sb-')) {
                    sessionKeysToRemove.push(key);
                }
            }
            sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
        }
    } catch (error) {
        console.error('Error clearing auth storage:', error);
    }
};

/**
 * Check if a user is currently authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
    const user = await getCurrentUser();
    return user !== null;
};
