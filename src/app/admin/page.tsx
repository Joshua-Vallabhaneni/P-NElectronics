'use client';

import Link from 'next/link';
import { Inbox, Package, ShoppingCart, Layers, ArrowRight } from 'lucide-react';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

const steps = [
    {
        number: '01',
        icon: Inbox,
        title: 'Review Submissions',
        description: 'When a user submits a quote request through the "Sell To Us" form, it appears under Submissions. Review the details, set a quoted price, then Accept or Reject.',
        action: { label: 'Go to Submissions', href: '/admin/submissions' },
    },
    {
        number: '02',
        icon: Package,
        title: 'Add Items Manually',
        description: 'Need to add inventory that didn\'t come from a submission? Click "+ New Product" in Manage Inventory. The item will appear in the Verified Items tab.',
        action: { label: 'Manage Inventory', href: '/admin/inventory' },
    },
    {
        number: '03',
        icon: ShoppingCart,
        title: 'List Verified Items',
        description: 'In the Verified Items tab, click "List Item" on any item to create a public product listing. Fill in the details and it goes live on the Inventory page.',
        action: null,
    },
    {
        number: '04',
        icon: Layers,
        title: 'Bundle Into Lots',
        description: 'Group multiple verified items together as a lot/bundle for bulk sale. Click "Create Lot" and select the items to include. All item photos are combined into the listing.',
        action: null,
    },
];

function AdminGuideContent() {
    return (
        <div className="min-h-screen pt-14">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 max-w-3xl">
                <div className="mb-10">
                    <p className="text-xs uppercase tracking-widest text-emerald-400 mb-3">Admin Portal</p>
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">How It Works</h1>
                    <p className="text-neutral-400">
                        A quick guide to managing inventory and quote requests.
                    </p>
                </div>

                <div className="space-y-6">
                    {steps.map((step) => (
                        <div
                            key={step.number}
                            className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6"
                        >
                            <div className="flex gap-4">
                                <div className="flex flex-col items-center shrink-0">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-1">
                                        <step.icon className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <span className="text-xs font-mono text-neutral-600">{step.number}</span>
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-white font-semibold mb-1">{step.title}</h3>
                                    <p className="text-neutral-400 text-sm leading-relaxed">{step.description}</p>
                                    {step.action && (
                                        <Link
                                            href={step.action.href}
                                            className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 text-sm font-medium mt-3 transition-colors"
                                        >
                                            {step.action.label}
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function AdminPage() {
    return (
        <ProtectedRoute requireAdmin>
            <AdminGuideContent />
        </ProtectedRoute>
    );
}
