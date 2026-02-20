import Link from 'next/link';
import { Recycle, Shield, Leaf } from 'lucide-react';

export function Footer() {
    return (
        <footer className="bg-[#070d1a] border-t border-neutral-800/50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Company Info */}
                    <div className="space-y-3">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                                <Recycle className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-base font-bold text-white">P&N Electronics</span>
                        </Link>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            Professional IT Asset Disposition. Secure data destruction,
                            certified recycling, and global refurbishment.
                        </p>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 rounded-md">
                                <Shield className="w-3 h-3 text-emerald-400" />
                                <span className="text-xs text-emerald-400">NIST 800-88</span>
                            </div>
                            <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 rounded-md">
                                <Leaf className="w-3 h-3 text-emerald-400" />
                                <span className="text-xs text-emerald-400">Zero Landfill</span>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div>
                        <h3 className="text-white font-semibold text-sm mb-3">Navigation</h3>
                        <ul className="space-y-1.5">
                            {[
                                { name: 'Our Services', href: '/services' },
                                { name: 'Browse Inventory', href: '/inventory' },
                                { name: 'Sell Your Assets', href: '/sell' },
                            ].map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className="text-slate-400 hover:text-emerald-400 text-sm transition-colors"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Services */}
                    <div>
                        <h3 className="text-white font-semibold text-sm mb-3">Services</h3>
                        <ul className="space-y-1.5">
                            {[
                                'Secure Data Destruction',
                                'Circular Recycling & Scrap Recovery',
                                'Global Refurbishment',
                            ].map((service) => (
                                <li key={service}>
                                    <span className="text-slate-400 text-sm">{service}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-8 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-3">
                    <p className="text-slate-500 text-xs">
                        © {new Date().getFullYear()} P&N Electronics. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
