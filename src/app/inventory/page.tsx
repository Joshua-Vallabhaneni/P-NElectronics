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
    A: { label: 'Grade A - Like New', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    B: { label: 'Grade B - Good', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    refurbished: { label: 'Refurbished', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    parts: { label: 'Parts Only', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
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
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 mb-8">
            <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                Condition Grading Guide
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {Object.entries(conditionLabels).map(([key, { label, color }]) => (
                    <div key={key} className="flex items-center gap-2">
                        <Badge variant="outline" className={`${color} border`}>
                            {key === 'parts' ? 'Parts' : key === 'refurbished' ? 'Refurb' : `Grade ${key}`}
                        </Badge>
                        <span className="text-neutral-400 text-sm">{label.split(' - ')[1] || label}</span>
                    </div>
                ))}
            </div>
            <p className="text-neutral-500 text-xs mt-3">
                Every item has undergone a 20-point diagnostic check and NIST 800-88 data sanitization.
            </p>
        </div>
    );
}

function ProductCard({ product }: { product: Product }) {
    const condition = conditionLabels[product.condition];
    const CategoryIcon = categoryIcons[product.category?.slug || 'laptop'] || Package;

    return (
        <Link href={`/inventory/${product.id}`}>
            <Card className="bg-neutral-900/50 border-neutral-800 hover:bg-neutral-900 hover:border-emerald-500/30 transition-all duration-300 group h-full cursor-pointer">
                <CardContent className="p-0">
                    {/* Image */}
                    <div className="aspect-video bg-slate-800 relative overflow-hidden rounded-t-lg">
                        {product.images && product.images[0] ? (
                            <img
                                src={product.images[0]}
                                alt={product.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <CategoryIcon className="w-16 h-16 text-slate-600" />
                            </div>
                        )}
                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex gap-2">
                            <Badge variant="outline" className={`${condition.color} border backdrop-blur-sm`}>
                                {product.condition === 'parts' ? 'Parts' : product.condition === 'refurbished' ? 'Refurb' : `Grade ${product.condition}`}
                            </Badge>
                            {product.is_bulk_lot && (
                                <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 backdrop-blur-sm">
                                    Bulk Lot
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                        <h3 className="text-white font-semibold mb-1 group-hover:text-emerald-400 transition-colors line-clamp-1">
                            {product.title}
                        </h3>
                        <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                            {product.brand} {product.model}
                        </p>

                        {/* Specs */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {product.processor && (
                                <span className="text-xs px-2 py-1 bg-white/5 rounded text-slate-300">
                                    {product.processor}
                                </span>
                            )}
                            {product.ram && (
                                <span className="text-xs px-2 py-1 bg-white/5 rounded text-slate-300">
                                    {product.ram}
                                </span>
                            )}
                            {product.storage && (
                                <span className="text-xs px-2 py-1 bg-white/5 rounded text-slate-300">
                                    {product.storage}
                                </span>
                            )}
                        </div>

                        {/* Price and Quantity */}
                        <div className="flex items-center justify-between">
                            <div>
                                {product.price ? (
                                    <span className="text-xl font-bold text-emerald-400">${product.price.toFixed(2)}</span>
                                ) : (
                                    <span className="text-slate-500">Contact for price</span>
                                )}
                            </div>
                            <span className="text-slate-400 text-sm">
                                Qty: {product.quantity}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
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
                <label className="text-sm font-medium text-slate-300 mb-2 block">Category</label>
                <Select
                    value={filters.category || 'all'}
                    onValueChange={(value) => setFilters({ ...filters, category: value === 'all' ? '' : value })}
                >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
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
                <label className="text-sm font-medium text-slate-300 mb-2 block">Condition</label>
                <Select
                    value={filters.condition || 'all'}
                    onValueChange={(value) => setFilters({ ...filters, condition: value === 'all' ? '' : value })}
                >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="All Conditions" />
                    </SelectTrigger>
                    <SelectContent>
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
                <label className="text-sm font-medium text-slate-300 mb-2 block">Listing Type</label>
                <Select
                    value={filters.type || 'all'}
                    onValueChange={(value) => setFilters({ ...filters, type: value === 'all' ? '' : value })}
                >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="individual">Individual Items</SelectItem>
                        <SelectItem value="bulk">Bulk Lots</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Clear Filters */}
            <Button
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10"
                onClick={() => setFilters({ category: '', condition: '', type: '', search: '' })}
            >
                Clear All Filters
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
        <div className="bg-slate-950 pt-14">
            {/* Hero */}
            <section className="pt-12 pb-8">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <p className="text-xs uppercase tracking-widest text-emerald-400 mb-3">
                            Inventory
                        </p>
                        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
                            Browse Our Inventory
                        </h1>
                        <p className="text-base text-neutral-400 max-w-xl">
                            Quality refurbished IT equipment with certified data sanitization.
                        </p>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-8 min-h-screen">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <GradingLegend />

                    {/* Search and Filter Bar */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-8">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input
                                type="text"
                                placeholder="Search products..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="pl-10 bg-neutral-900/50 border-neutral-800 text-white placeholder:text-neutral-500"
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
                            <SheetContent side="left" className="w-80 bg-slate-950 border-neutral-800">
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
                        <div className="hidden lg:block w-64 flex-shrink-0">
                            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 sticky top-24">
                                <h3 className="text-lg font-semibold text-white mb-6">Filters</h3>
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
