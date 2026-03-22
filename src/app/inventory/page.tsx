'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, Grid3X3, List, Package, Laptop, Monitor, Server, Printer, HardDrive, Smartphone, Cpu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/lib/supabase';
import type { Product, Category, ConditionGrade } from '@/types/database';
import { Loader } from '@/components/common/Loader';

const conditionLabels: Record<ConditionGrade, { label: string; color: string }> = {
    A: { label: 'Grade A - Like New', color: 'bg-[#00C48C] text-[#0e0e0e] border-[#00C48C]' },
    B: { label: 'Grade B - Good', color: 'bg-[#2A7A5E] text-white border-transparent' },
    refurbished: { label: 'Refurbished', color: 'bg-transparent border-[#00C48C] text-[#00C48C]' },
    parts: { label: 'Parts Only', color: 'bg-transparent border-[#3A4A42] text-[#6A7A72]' },
};

const categoryIcons: Record<string, any> = {
    laptop: Laptop,
    desktop: HardDrive,
    gpu: Cpu,
    phone: Smartphone,
    other: Package,
};

function GradingLegend() {
    return (
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 mb-8 py-4 border-y border-white/[0.03]">
            <div className="flex items-center gap-2 pr-8 border-r border-white/5 hidden md:flex">
                <Package className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-widest">Protocol</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                {Object.entries(conditionLabels).map(([key, { color }]) => (
                    <div key={key} className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${color}`}>
                            {key === 'parts' ? 'Parts' : key === 'refurbished' ? 'Refurb' : `Grade ${key}`}
                        </span>
                        <span className="text-xs text-zinc-500 font-medium whitespace-nowrap">
                            {key === 'A' ? 'Verified Renewal' : key === 'B' ? 'Minor Wear' : key === 'refurbished' ? 'Certified Restoration' : 'Component-Sourced'}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ProductCard({ product }: { product: Product }) {
    const condition = conditionLabels[product.condition];
    const CategoryIcon = categoryIcons[product.category?.slug || 'laptop'] || Package;

    return (
        <Link href={`/inventory/${product.id}`} className="group block h-full">
            <div className="h-full rounded-2xl bg-white/[0.01] border border-white/[0.05] hover:border-emerald-500/20 hover:bg-white/[0.02] transition-all duration-500 overflow-hidden flex flex-col relative group">
                {/* Visual Header */}
                <div className="aspect-[16/10] bg-zinc-900 relative overflow-hidden">
                    {product.images && product.images[0] ? (
                        <img
                            src={product.images[0]}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-60 group-hover:opacity-100"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                            <CategoryIcon className="w-12 h-12 text-white/5 opacity-50 group-hover:scale-110 transition-transform duration-700" />
                        </div>
                    )}

                    {/* Floating Badge */}
                    <div className="absolute top-4 left-4 z-20">
                        <span className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-widest backdrop-blur-md border ${condition.color}`}>
                            {product.condition === 'parts' ? 'Parts' : product.condition === 'refurbished' ? 'Refurb' : `Grade ${product.condition}`}
                        </span>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                    <div className="mb-4">
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors line-clamp-2 tracking-tight leading-tight">
                            {product.title}
                        </h3>
                        {/* Specs Inline */}
                        <div className="flex flex-wrap gap-2">
                            {product.processor && (
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                                    {product.processor}
                                </span>
                            )}
                            {product.ram && (
                                <>
                                    <span className="text-[10px] text-zinc-700">•</span>
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                                        {product.ram}
                                    </span>
                                </>
                            )}
                            {product.storage && (
                                <>
                                    <span className="text-[10px] text-zinc-700">•</span>
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                                        {product.storage}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Footer Row */}
                    <div className="mt-auto pt-4 border-t border-white/[0.05] flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-[0.2em] mb-1">Asset Value</span>
                            {product.price ? (
                                <span className="text-lg font-bold text-white tracking-tight">${product.price.toLocaleString()}</span>
                            ) : (
                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-tighter">Quote Eq.</span>
                            )}
                        </div>
                        <div className="text-right flex flex-col items-end">
                            <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-[0.2em] mb-1">In Stock</span>
                            <span className="text-sm font-bold text-white">{product.quantity} <span className="text-zinc-500 text-[10px] font-medium uppercase ml-1">Units</span></span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}

function FilterSidebar({
    categories,
    filters,
    setFilters,
    onClose,
}: {
    categories: Category[];
    filters: any;
    setFilters: (filters: any) => void;
    onClose?: () => void;
}) {
    return (
        <div className="space-y-6">
            {onClose && (
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <h3 className="text-lg font-semibold text-white">Filters</h3>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>
            )}

            {/* Category Filter */}
            <div>
                <label className="text-[10px] font-bold text-zinc-500 mb-3 block uppercase tracking-widest">Category</label>
                <Select
                    value={filters.category || 'all'}
                    onValueChange={(value) => setFilters({ ...filters, category: value === 'all' ? '' : value })}
                >
                    <SelectTrigger className="h-10 bg-white/[0.02] border-white/10 text-zinc-300 hover:border-emerald-500/30 hover:text-white transition-all">
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-900 text-zinc-300">
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Condition Filter */}
            <div>
                <label className="text-[10px] font-bold text-zinc-500 mb-3 block uppercase tracking-widest">Condition</label>
                <Select
                    value={filters.condition || 'all'}
                    onValueChange={(value) => setFilters({ ...filters, condition: value === 'all' ? '' : value })}
                >
                    <SelectTrigger className="h-10 bg-white/[0.02] border-white/10 text-zinc-300 hover:border-emerald-500/30 hover:text-white transition-all">
                        <SelectValue placeholder="All Conditions" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-900 text-zinc-300">
                        <SelectItem value="all">All Conditions</SelectItem>
                        <SelectItem value="A">Grade A - Like New</SelectItem>
                        <SelectItem value="B">Grade B - Good</SelectItem>
                        <SelectItem value="refurbished">Refurbished</SelectItem>
                        <SelectItem value="parts">Parts Only</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Type Filter */}
            <div>
                <label className="text-[10px] font-bold text-zinc-500 mb-3 block uppercase tracking-widest">Listing Type</label>
                <Select
                    value={filters.type || 'all'}
                    onValueChange={(value) => setFilters({ ...filters, type: value === 'all' ? '' : value })}
                >
                    <SelectTrigger className="h-10 bg-white/[0.02] border-white/10 text-zinc-300 hover:border-emerald-500/30 hover:text-white transition-all">
                        <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-900 text-zinc-300">
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="individual">Individual Items</SelectItem>
                        <SelectItem value="bulk">Bulk Lots</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Clear Filters */}
            <Button
                variant="ghost"
                className="w-full text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/5 transition-all text-xs font-bold uppercase tracking-widest mt-4"
                onClick={() => setFilters({ category: '', condition: '', type: '', search: '' })}
            >
                Clear Filters
            </Button>
        </div>
    );
}

export default function InventoryPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        category: '',
        condition: '',
        type: '',
        search: '',
    });
    const [filterOpen, setFilterOpen] = useState(false);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                // Fetch categories
                const { data: categoriesData } = await supabase
                    .from('categories')
                    .select('*')
                    .order('name');

                if (categoriesData) {
                    setCategories(categoriesData);
                }

                // Build products query
                let query = supabase
                    .from('products')
                    .select('*, category:categories(*)')
                    .eq('is_available', true)
                    .order('created_at', { ascending: false });

                if (filters.category) {
                    query = query.eq('category_id', filters.category);
                }
                if (filters.condition) {
                    query = query.eq('condition', filters.condition as ConditionGrade);
                }
                if (filters.type === 'bulk') {
                    query = query.eq('is_bulk_lot', true);
                } else if (filters.type === 'individual') {
                    query = query.eq('is_bulk_lot', false);
                }
                if (filters.search) {
                    query = query.or(`title.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%`);
                }

                const { data: productsData } = await query;

                if (productsData) {
                    setProducts(productsData);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [filters]);

    return (
        <div className="min-h-screen flex flex-col pt-14 text-white">
            {/* Hero */}
            <section className="pt-8 pb-0">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-2">
                        <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-emerald-400/60 mb-3">
                            Inventory Portal
                        </p>
                        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">
                            Browse Our Inventory
                        </h1>
                        <p className="text-base text-zinc-500 max-w-xl">
                            Quality refurbished IT equipment with certified data sanitization.
                        </p>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-4 flex-1">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <GradingLegend />

                    {/* Search and Filter Bar */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-8">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
                            <Input
                                type="text"
                                placeholder="Search inventory..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="h-10 pl-10 bg-white/[0.02] border-white/[0.05] text-white placeholder:text-zinc-600 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/50 transition-all font-medium text-sm"
                            />
                        </div>

                        {/* Mobile Filter Button */}
                        <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
                            <SheetTrigger asChild className="lg:hidden">
                                <Button variant="outline" className="border-neutral-700 text-white hover:bg-neutral-800">
                                    <Filter className="w-4 h-4 mr-2" />
                                    Filters
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-80 bg-[#0e0e0e] border-neutral-800">
                                <FilterSidebar
                                    categories={categories}
                                    filters={filters}
                                    setFilters={setFilters}
                                    onClose={() => setFilterOpen(false)}
                                />
                            </SheetContent>
                        </Sheet>
                    </div>

                    <div className="flex gap-8">
                        {/* Desktop Sidebar */}
                        <div className="hidden lg:block w-72 flex-shrink-0">
                            <div className="rounded-2xl border border-white/[0.05] bg-white/[0.01] backdrop-blur-xl p-8 sticky top-24">
                                <h3 className="text-lg font-bold text-white mb-8 tracking-tight uppercase tracking-widest text-[10px] opacity-40">Filters</h3>
                                <FilterSidebar
                                    categories={categories}
                                    filters={filters}
                                    setFilters={setFilters}
                                />
                            </div>
                        </div>

                        {/* Products Grid */}
                        <div className="flex-1">
                            {loading ? (
                                <Loader message="Loading products..." />
                            ) : products.length === 0 ? (
                                <div className="text-center py-16">
                                    <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-white mb-2">No products found</h3>
                                    <p className="text-slate-400 mb-6">Try adjusting your filters or search terms.</p>
                                    <Button
                                        variant="outline"
                                        className="border-white/20 text-white hover:bg-white/10"
                                        onClick={() => setFilters({ category: '', condition: '', type: '', search: '' })}
                                    >
                                        Clear Filters
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <p className="text-slate-400 mb-4">{products.length} products found</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {products.map((product) => (
                                            <ProductCard key={product.id} product={product} />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
