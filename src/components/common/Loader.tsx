'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type LoaderVariant = 'section' | 'page' | 'overlay';

interface LoaderProps {
    message: string;
    subMessage?: string;
    variant?: LoaderVariant;
    className?: string;
}

/**
 * Loader component with multiple variants
 */
export function Loader({
    message,
    subMessage,
    variant = 'section',
    className
}: LoaderProps) {
    if (variant === 'overlay') {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className={cn('bg-white rounded-xl p-6 text-center shadow-xl', className)}>
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-300 border-t-emerald-500 mx-auto mb-4"></div>
                    <p className="text-slate-900 font-medium">{message}</p>
                    {subMessage && <p className="text-slate-600 mt-1">{subMessage}</p>}
                </div>
            </div>
        );
    }

    if (variant === 'page') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className={cn('text-center', className)}>
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-600 border-t-emerald-500 mx-auto mb-4"></div>
                    <p className="text-white font-medium">{message}</p>
                    {subMessage && <p className="text-slate-400 mt-1">{subMessage}</p>}
                </div>
            </div>
        );
    }

    // section (default)
    return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className={cn('text-center', className)}>
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-300 border-t-emerald-500 mx-auto mb-4"></div>
                <p className="text-slate-600">{message}</p>
                {subMessage && <p className="text-slate-500 mt-1">{subMessage}</p>}
            </div>
        </div>
    );
}
