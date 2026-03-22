'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, Laptop, HardDrive, Smartphone, Cpu, Mail, CheckCircle, List, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import type { Product, ConditionGrade, VerifiedItem } from '@/types/database';
import { Loader } from '@/components/common/Loader';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";

const conditionLabels: Record<ConditionGrade, { label: string; description: string; color: string }> = {
    A: {
        label: 'Grade A',
        description: 'Verified Renewal: Excellent condition with minimal to no signs of use. Fully tested and functional.',
        color: 'bg-[#00C48C] text-[#0e0e0e] border-[#00C48C]'
    },
    B: {
        label: 'Grade B',
        description: 'Minor Wear: Minor cosmetic wear (light scratches, scuffs). Fully functional with all features working.',
        color: 'bg-[#2A7A5E] text-white border-transparent'
    },
    refurbished: {
        label: 'Refurb',
        description: 'Certified Restoration: Repaired in-house with replacement parts (e.g., new SSD, RAM, or battery). Like-new performance.',
        color: 'bg-transparent border-[#00C48C] text-[#00C48C]'
    },
    parts: {
        label: 'Parts',
        description: 'Component-Sourced: For hobbyists or recyclers looking for specific components. May not power on.',
        color: 'bg-transparent border-[#3A4A42] text-[#6A7A72]'
    },
};

const categoryIcons: Record<string, any> = {
    laptop: Laptop,
    desktop: HardDrive,
    gpu: Cpu,
    phone: Smartphone,
    other: Package,
};

function humanizeEnum(value: string | null | undefined): string {
    if (!value) return '';
    return value
        .toLowerCase()
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        .replace('No Os', 'No OS')
        .replace('Ssd', 'SSD')
        .replace('Hdd', 'HDD')
        .replace('Nvme', 'NVMe');
}

function cleanTitle(title: string): string {
    return title.replace(/^\[LOT\]\s*/i, '');
}

function buildInquiryLink(product: Product, condition: { label: string }) {
    const priceStr = product.price ? `$${product.price.toFixed(2)}` : 'Contact for pricing';
    const subject = encodeURIComponent(`Inquiry: ${product.title}`);
    const bodyLines = [
        'Hi P and N Electronics,',
        '',
        'I am interested in the following item from your inventory:',
        '',
        `Product: ${product.title}`,
        `Condition: ${condition.label}`,
        `Price: ${priceStr}`,
        '',
        'My name is [YOUR NAME HERE].',
        '',
        '[Any additional questions or comments here]',
        '',
        'Thank you!',
    ];
    const body = encodeURIComponent(bodyLines.join('\n'));
    // Use Gmail compose URL — works reliably in all browsers including Arc
    return `https://mail.google.com/mail/?view=cm&fs=1&to=pnelectronicsllc@gmail.com&su=${subject}&body=${body}`;
}

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const fromLot = searchParams.get('fromLot') === 'true';
    const fromLotId = searchParams.get('fromLotId');
    const lotName = searchParams.get('lotName');

    const [product, setProduct] = useState<Product | null>(null);
    const [lotItems, setLotItems] = useState<VerifiedItem[]>([]);
    const [selectedLotItem, setSelectedLotItem] = useState<VerifiedItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);

    useEffect(() => {
        async function fetchProduct() {
            const productId = Array.isArray(params.id) ? params.id[0] : params.id;
            if (!productId) return;

            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*, category:categories(*)')
                    .eq('id', productId)
                    .single();

                if (error) throw error;
                setProduct(data);

                // If it's a lot, fetch individual items
                if (data.is_bulk_lot && data.lot_number) {
                    const { data: lotData } = await supabase
                        .from('lots')
                        .select('id')
                        .eq('lot_number', data.lot_number)
                        .single();

                    if (lotData) {
                        const { data: items } = await supabase
                            .from('lot_items')
                            .select('verified_items(*)')
                            .eq('lot_id', lotData.id);

                        if (items) {
                            const flattened = items
                                .map(i => i.verified_items)
                                .filter(Boolean) as unknown as VerifiedItem[];
                            setLotItems(flattened);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching product:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchProduct();
    }, [params.id]);

    if (loading) {
        return <Loader message="Loading product..." variant="page" />;
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center">
                <div className="text-center">
                    <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Product Not Found</h2>
                    <p className="text-slate-400 mb-6">The product you&apos;re looking for doesn&apos;t exist.</p>
                    <Link href="/inventory">
                        <Button>Back to Inventory</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const condition = conditionLabels[product.condition];
    const CategoryIcon = categoryIcons[product.category?.slug || 'laptop'] || Package;
    const hasImages = product.images && product.images.length > 0;

    // Collect specs into an array for inline display
    const specs: { label: string; value: string }[] = [];
    if (product.processor) specs.push({ label: 'Processor', value: product.processor });
    if (product.ram) specs.push({ label: 'RAM', value: product.ram });
    if (product.storage) specs.push({ label: 'Storage', value: product.storage });
    if (product.category) specs.push({ label: 'Category', value: product.category.name });

    return (
        <div className="min-h-screen pt-20 pb-8">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Button */}
                <Link
                    href={fromLot && fromLotId ? `/inventory/${fromLotId}` : "/inventory"}
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {fromLot ? `Back to ${lotName || 'Lot'}` : "Back to Inventory"}
                </Link>

                <div className={`grid gap-12 ${hasImages ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-2xl mx-auto'}`}>
                    {/* Image Gallery */}
                    {hasImages && (
                        <div className="flex flex-col gap-6">
                            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden aspect-square flex items-center justify-center relative group">
                                <img
                                    src={product.images![selectedImage]}
                                    alt={product.title}
                                    className="max-w-full max-h-full w-auto h-auto object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                            </div>

                            {/* Thumbnail Row */}
                            {product.images!.length > 1 && (
                                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                                    {product.images!.map((image, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedImage(index)}
                                            className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-500 relative group/thumb ${selectedImage === index
                                                ? 'border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.35)] ring-1 ring-emerald-500/50'
                                                : 'border-white/5 hover:border-white/20'
                                                }`}
                                        >
                                            <img src={image} alt="" className={`w-full h-full object-cover transition-opacity duration-300 ${selectedImage === index ? 'opacity-100' : 'opacity-40 group-hover/thumb:opacity-70'}`} />
                                            {selectedImage === index && (
                                                <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Product Info */}
                    <div className="flex flex-col h-full">
                        <div className="space-y-6 flex-1">
                            <div>
                                {/* Title + Badge Inline */}
                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                    <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                                        {cleanTitle(product.title)}
                                    </h1>
                                    <Badge variant="outline" className={`${condition.color} border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest mt-1`}>
                                        {condition.label}
                                    </Badge>
                                </div>

                                {/* Useful Subtitle */}
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-emerald-500/80 font-semibold tracking-wide uppercase text-[10px]">
                                        {product.category?.name && product.category.slug !== 'unassigned' ? product.category.name : 'Mixed Lot'}
                                    </span>
                                    <span className="text-zinc-600">/</span>
                                    <span className="text-zinc-400 font-medium">
                                        {product.brand && product.model
                                            ? `${product.brand} ${product.model}`
                                            : product.condition === 'A' ? 'Verified Renewal' : 'Certified Restoration'}
                                    </span>
                                </div>
                            </div>

                            {/* Price + Stock (Tightened) */}
                            {!fromLot && (
                                <div className="space-y-0.5">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold text-white tracking-tight">${product.price?.toFixed(2) || '---'}</span>
                                        <span className="text-zinc-500 text-sm font-medium">USD</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${product.quantity > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                                        <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider">
                                            {product.quantity} {product.quantity === 1 ? 'Unit' : 'Units'} available in stock
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Metadata Grid (Spec Table) */}
                            {specs.length > 0 && (
                                <div className="grid grid-cols-2 border border-white/5 rounded-2xl overflow-hidden bg-white/[0.01]">
                                    {specs.map((spec, i) => (
                                        <div
                                            key={spec.label}
                                            className={`p-5 flex flex-col gap-1.5 ${i < 2 ? 'border-b border-white/5' : ''} ${i % 2 === 0 ? 'border-r border-white/5' : ''}`}
                                        >
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                                {spec.label}
                                            </span>
                                            <span className="text-sm text-white font-medium">
                                                {spec.value}
                                            </span>
                                        </div>
                                    ))}
                                    {/* Fill empty cell if specs are odd */}
                                    {specs.length % 2 !== 0 && (
                                        <div className="p-5 border-b border-white/5 bg-transparent" />
                                    )}
                                </div>
                            )}

                            {/* Description */}
                            {product.description && (
                                <div className="space-y-2">
                                    <h3 className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest">Notes & Details</h3>
                                    <p className="text-zinc-400 text-sm leading-relaxed max-w-prose">
                                        {product.description}
                                    </p>
                                </div>
                            )}

                            {/* Lot Items Section */}
                            {product.is_bulk_lot && lotItems.length > 0 && (
                                <div className="space-y-4 pt-4">
                                    <div className="flex items-center gap-2">
                                        <List className="w-3.5 h-3.5 text-emerald-500" />
                                        <h3 className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest">Included in this Lot</h3>
                                    </div>
                                    <div className="grid gap-3">
                                        {lotItems.map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={() => setSelectedLotItem(item)}
                                                className="bg-white/[0.03] border border-white/5 rounded-xl p-4 flex items-center justify-between group hover:bg-white/[0.05] hover:border-emerald-500/20 hover:translate-x-1 transition-all cursor-pointer"
                                            >
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-white font-semibold text-sm group-hover:text-emerald-400 transition-colors">
                                                        {[item.brand, item.model].filter(Boolean).join(' ') || item.category}
                                                    </span>
                                                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-medium uppercase tracking-tight">
                                                        {item.processor && <span>{humanizeEnum(item.processor)}</span>}
                                                        {item.processor && (item.ram || item.storage) && <span>•</span>}
                                                        {item.ram && <span>{item.ram} RAM</span>}
                                                        {item.ram && item.storage && <span>•</span>}
                                                        {item.storage && <span>{item.storage}</span>}
                                                        <span>•</span>
                                                        <span className="text-emerald-400/80 font-bold">{item.condition} Grade</span>
                                                        <span>•</span>
                                                        <span>Qty: {item.quantity}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-emerald-500/40 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all">
                                                    <ChevronRight className="w-5 h-5" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Inquiry CTA (Toned down) */}
                            <div className="pt-4">
                                <Button
                                    className="min-w-[240px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 rounded-xl transition-all duration-300 gap-2 group shadow-lg shadow-emerald-500/10 active:scale-95"
                                    onClick={() => {
                                        window.open(buildInquiryLink(product, condition), '_blank');
                                    }}
                                >
                                    <Mail className="w-4 h-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                                    Submit Inquiry
                                </Button>
                            </div>
                        </div>

                        {/* Dead Zone Filler (What's Included) */}
                        <div className="mt-12 pt-8 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                        <Cpu className="w-4 h-4 text-emerald-400" />
                                    </div>
                                    <h4 className="text-sm font-bold text-white">ITAD Protocol</h4>
                                </div>
                                <p className="text-xs text-zinc-500 leading-relaxed">
                                    Fully remediated according to NIST 800-88 sanitization standards. Verified hardware diagnostic reports available upon request.
                                </p>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                        <Package className="w-4 h-4 text-emerald-400" />
                                    </div>
                                    <h4 className="text-sm font-bold text-white">Chain of Custody</h4>
                                </div>
                                <p className="text-xs text-zinc-500 leading-relaxed">
                                    Every asset follows a strict secure logistics path from intake to final certification, ensuring full transparency.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lot Item Detail Sheet */}
            <Sheet open={!!selectedLotItem} onOpenChange={(open) => !open && setSelectedLotItem(null)}>
                <SheetContent className="w-full sm:max-w-md bg-[#0e0e0e] border-white/10 p-0 overflow-y-auto scrollbar-none">
                    {selectedLotItem && (
                        <div className="flex flex-col h-full">
                            <SheetHeader className="p-8 border-b border-white/5 space-y-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-emerald-500/80 font-bold text-[10px] uppercase tracking-widest">
                                        <Package className="w-3 h-3" />
                                        Lot Item Specification
                                    </div>
                                    <SheetTitle className="text-2xl font-bold text-white tracking-tight">
                                        {[selectedLotItem.brand, selectedLotItem.model].filter(Boolean).join(' ') || selectedLotItem.category}
                                    </SheetTitle>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline" className="bg-[#00C48C]/10 text-[#00C48C] border-[#00C48C]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">
                                        {selectedLotItem.condition} Grade
                                    </Badge>
                                    <Badge variant="outline" className="bg-white/5 text-zinc-400 border-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">
                                        Qty: {selectedLotItem.quantity}
                                    </Badge>
                                </div>
                            </SheetHeader>

                            <div className="p-8 space-y-8">
                                {/* Images (if any) */}
                                {selectedLotItem.images && selectedLotItem.images.length > 0 && (
                                    <div className="grid gap-4">
                                        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden aspect-square flex items-center justify-center">
                                            <img
                                                src={selectedLotItem.images[0]}
                                                alt=""
                                                className="max-w-full max-h-full w-auto h-auto object-contain"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Specs Grid */}
                                <div className="grid grid-cols-2 border border-white/5 rounded-2xl overflow-hidden bg-white/[0.01]">
                                    {[
                                        { label: 'Processor', value: humanizeEnum(selectedLotItem.processor) },
                                        { label: 'RAM', value: selectedLotItem.ram },
                                        { label: 'Storage', value: selectedLotItem.storage },
                                        { label: 'Category', value: selectedLotItem.category },
                                    ].filter(s => s.value).map((spec, i, arr) => (
                                        <div
                                            key={spec.label}
                                            className={`p-5 flex flex-col gap-1.5 ${i < 2 && arr.length > 2 ? 'border-b border-white/5' : ''} ${i % 2 === 0 ? 'border-r border-white/5' : ''}`}
                                        >
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                                {spec.label}
                                            </span>
                                            <span className="text-sm text-white font-medium">
                                                {spec.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Notes */}
                                {selectedLotItem.admin_notes && (
                                    <div className="space-y-2">
                                        <h3 className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest">Item Notes</h3>
                                        <p className="text-zinc-400 text-sm leading-relaxed">
                                            {selectedLotItem.admin_notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
