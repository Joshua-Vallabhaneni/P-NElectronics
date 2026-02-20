'use client';

import { ProtectedRoute } from '@/components/common/ProtectedRoute';

export function AuthGuard({ children }: { children: React.ReactNode }) {
    return <ProtectedRoute>{children}</ProtectedRoute>;
}
