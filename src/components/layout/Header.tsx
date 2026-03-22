'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Menu, Recycle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const userNavigation = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Inventory', href: '/inventory' },
    { name: 'Sell To Us', href: '/sell' },
];

const adminNavigation = [
    { name: 'Home', href: '/' },
    { name: 'Submissions', href: '/admin/submissions' },
    { name: 'Manage Inventory', href: '/admin/inventory' },
];

export function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const isHome = pathname === '/';
    const { isAdmin, user, signOut } = useAuth();

    const navigation = user && isAdmin ? adminNavigation : userNavigation;

    return (
        <header
            className={cn(
                'fixed top-0 z-50 w-full transition-colors',
                isHome
                    ? 'bg-transparent'
                    : 'border-b border-neutral-800 bg-[#0e0e0e]/95 backdrop-blur-xl'
            )}
        >
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-14 items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                            <Recycle className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-base font-bold text-white">P&N Electronics</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                                    pathname === item.href
                                        ? 'text-white bg-white/15'
                                        : 'text-white/70 hover:text-white'
                                )}
                            >
                                {item.name}
                            </Link>
                        ))}
                        <button
                            onClick={async () => { await signOut(); router.push('/'); }}
                            className="ml-2 px-3 py-1.5 rounded-md text-sm font-medium text-white/50 hover:text-white transition-colors flex items-center gap-1.5"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            Sign Out
                        </button>
                    </div>

                    {/* Mobile Navigation */}
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild className="md:hidden">
                            <Button variant="ghost" size="icon" className="text-white h-8 w-8">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-72 bg-slate-950 border-neutral-800">
                            <div className="flex flex-col gap-2 mt-8">
                                {navigation.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        className={cn(
                                            'px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                            pathname === item.href
                                                ? 'text-white bg-neutral-800'
                                                : 'text-neutral-400 hover:text-white'
                                        )}
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                                <button
                                    onClick={async () => { await signOut(); setIsOpen(false); router.push('/'); }}
                                    className="px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center gap-2 mt-4 border-t border-neutral-800 pt-4"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </button>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </nav>
        </header>
    );
}
