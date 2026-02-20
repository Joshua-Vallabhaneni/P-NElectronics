'use client';

/**
 * PROTECTED ROUTE COMPONENT
 * Wraps pages that require authentication (admin pages).
 * Optionally enforces admin role.
 */
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthPage } from '@/components/auth/AuthPage';
import { Loader } from './Loader';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
    const { user, loading, isAdmin } = useAuth();

    if (loading) {
        return <Loader message="Loading..." subMessage="Checking your authentication status" variant="page" />;
    }

    if (!user) {
        return <AuthPage />;
    }

    if (requireAdmin && !isAdmin) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-8">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldAlert className="w-8 h-8 text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
                    <p className="text-neutral-400 text-sm">
                        You don&apos;t have permission to access this page. This area is restricted to administrators.
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};
