'use client';

import Link from 'next/link';
import { Package, FileText, Settings, LogOut, LayoutDashboard, Plus, Inbox, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

function AdminDashboardContent() {
    const { user, signOut } = useAuth();

    const stats = [
        { label: 'Total Products', value: '—', icon: Package, href: '/admin/inventory' },
        { label: 'Submissions', value: '—', icon: Inbox, href: '/admin/submissions' },
    ];

    const quickActions = [
        { label: 'Add New Product', icon: Plus, href: '/admin/inventory' },
        { label: 'View Submissions', icon: Inbox, href: '/admin/submissions' },
        { label: 'Manage Inventory', icon: Package, href: '/admin/inventory' },
    ];

    return (
        <div className="min-h-screen bg-slate-900">
            {/* Header */}
            <header className="bg-slate-800 border-b border-white/10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Link href="/admin" className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                                    <LayoutDashboard className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-lg font-bold text-white">Admin Portal</span>
                            </Link>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-slate-400 text-sm">{user?.email}</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={signOut}
                                className="text-slate-400 hover:text-white"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Sign Out
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
                    <p className="text-slate-400">Welcome back! Manage your inventory and quote requests.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {stats.map((stat) => (
                        <Link key={stat.label} href={stat.href}>
                            <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                                            <stat.icon className="w-6 h-6 text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-sm">{stat.label}</p>
                                            <p className="text-2xl font-bold text-white">{stat.value}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                {/* Quick Actions */}
                <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                        <CardTitle className="text-white">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {quickActions.map((action) => (
                                <Link key={action.label} href={action.href}>
                                    <Button
                                        variant="outline"
                                        className="w-full h-auto py-4 border-white/20 text-white hover:bg-white/10 justify-start"
                                    >
                                        <action.icon className="w-5 h-5 mr-3 text-emerald-400" />
                                        {action.label}
                                    </Button>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Admin Navigation */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link href="/admin/inventory">
                        <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer h-full">
                            <CardContent className="p-6">
                                <Package className="w-8 h-8 text-emerald-400 mb-4" />
                                <h3 className="text-xl font-semibold text-white mb-2">Inventory Management</h3>
                                <p className="text-slate-400">List products, manage verified items, and create lots.</p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/admin/submissions">
                        <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer h-full">
                            <CardContent className="p-6">
                                <Inbox className="w-8 h-8 text-emerald-400 mb-4" />
                                <h3 className="text-xl font-semibold text-white mb-2">Submissions</h3>
                                <p className="text-slate-400">Review and verify incoming quote requests from users.</p>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </main>
        </div>
    );
}

export default function AdminPage() {
    return (
        <ProtectedRoute requireAdmin>
            <AdminDashboardContent />
        </ProtectedRoute>
    );
}
