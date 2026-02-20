import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Server-side Supabase client (for API routes)
export function createServerSupabaseClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
