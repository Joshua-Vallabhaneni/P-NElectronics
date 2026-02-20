import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (code) {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        try {
            const { error } = await supabase.auth.exchangeCodeForSession(code);

            if (error) {
                console.error('Error exchanging code for session:', error);
                return NextResponse.redirect(`${requestUrl.origin}/?error=confirmation_failed`);
            }
        } catch (error) {
            console.error('Error exchanging code for session:', error);
            return NextResponse.redirect(`${requestUrl.origin}/?error=confirmation_failed`);
        }
    }

    // Redirect to admin dashboard after successful confirmation
    return NextResponse.redirect(`${requestUrl.origin}/admin`);
}
