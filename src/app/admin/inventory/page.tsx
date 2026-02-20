'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDropzone } from 'react-dropzone';
import {
    ArrowLeft, Plus, Package, Pencil, Trash2, Eye, EyeOff, Layers,
    CheckCircle, Search, Loader2, X, Image as ImageIcon, ShoppingCart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Loader } from '@/components/common/Loader';
import { supabase } from '@/lib/supabase';
import type { Product, Category, ConditionGrade, VerifiedItem, Lot } from '@/types/database';
import { toast } from 'sonner';

const conditionLabels: Record<ConditionGrade, { label: string; color: string }> = {
    A: { label: 'Grade A', color: 'bg-emerald-500/20 text-emerald-400' },
    B: { label: 'Grade B', color: 'bg-blue-500/20 text-blue-400' },
    refurbished: { label: 'Refurb', color: 'bg-purple-500/20 text-purple-400' },
    parts: { label: 'Parts', color: 'bg-orange-500/20 text-orange-400' },
};

const conditionOptions: { value: ConditionGrade; label: string }[] = [
    { value: 'A', label: 'Grade A - Like New' },
    { value: 'B', label: 'Grade B - Good' },
    { value: 'refurbished', label: 'Refurbished' },
    { value: 'parts', label: 'Parts Only' },
];

// Map user conditions to inventory conditions
const conditionMapping: Record<string, ConditionGrade> = {
    functional: 'A',
    power_on_no_os: 'B',
    damaged_screen: 'refurbished',
    parts_only: 'parts',
};

function InventoryManagementContent() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('listed');
    const [products, setProducts] = useState<Product[]>([]);
    const [verifiedItems, setVerifiedItems] = useState<VerifiedItem[]>([]);
    const [lots, setLots] = useState<Lot[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Product creation modal
    const [createOpen, setCreateOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [prefillItem, setPrefillItem] = useState<VerifiedItem | null>(null);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [images, setImages] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category_id: '',
        brand: '',
        model: '',
        processor: '',
        ram: '',
        storage: '',
        condition: '' as ConditionGrade | '',
        quantity: 1,
        price: '',
        is_bulk_lot: false,
        lot_number: '',
    });

    // Lot creation modal
    const [lotCreateOpen, setLotCreateOpen] = useState(false);
    const [lotSaving, setLotSaving] = useState(false);
    const [lotData, setLotData] = useState({
        lot_number: '',
        title: '',
        description: '',
        total_price: '',
    });
    const [lotSelectedItems, setLotSelectedItems] = useState<string[]>([]);
    const [lotItemPickerOpen, setLotItemPickerOpen] = useState(false);

    // Auto-sync: ensure 1:1 match between accepted quotes and verified_items
    const syncVerifiedItems = async () => {
        try {
            // Get all accepted quote requests
            const { data: acceptedQuotes } = await supabase
                .from('quote_requests')
                .select('*')
                .eq('status', 'accepted');

            // Get all existing verified items
            const { data: existingItems } = await supabase
                .from('verified_items')
                .select('*')
                .order('created_at', { ascending: true });

            const acceptedIds = new Set((acceptedQuotes || []).map(q => q.id));
            const itemsByQuote = new Map<string, any[]>();

            // Group verified items by quote_request_id
            for (const item of (existingItems || [])) {
                if (!item.quote_request_id) continue;
                const list = itemsByQuote.get(item.quote_request_id) || [];
                list.push(item);
                itemsByQuote.set(item.quote_request_id, list);
            }

            // Delete duplicates (keep the first/oldest, remove the rest)
            const idsToDelete: string[] = [];
            for (const [, items] of itemsByQuote) {
                if (items.length > 1) {
                    // Keep first, delete the rest
                    for (let i = 1; i < items.length; i++) {
                        idsToDelete.push(items[i].id);
                    }
                }
            }

            // Delete orphans (verified_items whose quote is no longer accepted)
            for (const item of (existingItems || [])) {
                if (item.quote_request_id && !acceptedIds.has(item.quote_request_id)) {
                    idsToDelete.push(item.id);
                }
            }

            if (idsToDelete.length > 0) {
                await supabase.from('verified_items').delete().in('id', idsToDelete);
                console.log(`Removed ${idsToDelete.length} duplicate/orphaned verified item(s)`);
            }

            // Create missing verified items
            const existingQuoteIds = new Set([...itemsByQuote.keys()]);
            const missing = (acceptedQuotes || []).filter(q => !existingQuoteIds.has(q.id));

            if (missing.length > 0) {
                const inserts = missing.map(q => ({
                    quote_request_id: q.id,
                    category: q.category,
                    brand: q.brand_model?.split(' ')[0] || null,
                    model: q.brand_model?.split(' ').slice(1).join(' ') || null,
                    processor: q.processor || null,
                    ram: q.ram || null,
                    storage: q.storage_type || null,
                    condition: q.condition,
                    quantity: q.quantity,
                    quoted_price: q.quoted_price || null,
                    admin_notes: q.admin_notes || null,
                    images: q.image_urls || null,
                }));
                await supabase.from('verified_items').insert(inserts);
                console.log(`Created ${missing.length} missing verified item(s)`);
            }
        } catch (err) {
            console.error('Sync error:', err);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            // Sync first to fix any mismatches
            await syncVerifiedItems();

            const [productsRes, verifiedRes, lotsRes, categoriesRes] = await Promise.all([
                supabase.from('products').select('*, category:categories(*)').order('created_at', { ascending: false }),
                supabase.from('verified_items').select('*').order('created_at', { ascending: false }),
                supabase.from('lots').select('*').order('created_at', { ascending: false }),
                supabase.from('categories').select('*').order('name'),
            ]);

            if (productsRes.data) setProducts(productsRes.data);
            if (verifiedRes.data) setVerifiedItems(verifiedRes.data);
            if (lotsRes.data) setLots(lotsRes.data);
            if (categoriesRes.data) setCategories(categoriesRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load inventory data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // ── Image Upload ──
    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        setUploadingImages(true);
        const urls: string[] = [];
        try {
            for (const file of acceptedFiles) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `products/${fileName}`;
                const { error: uploadError } = await supabase.storage.from('uploads').upload(filePath, file);
                if (uploadError) { console.error('Upload error:', uploadError); continue; }
                const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(filePath);
                urls.push(publicUrl);
            }
            setImages(prev => [...prev, ...urls]);
            toast.success(`${urls.length} image(s) uploaded`);
        } catch (error) {
            toast.error('Failed to upload images');
        } finally {
            setUploadingImages(false);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
        maxFiles: 10,
    });

    // ── Open Create Product (blank or from verified item) ──
    const openCreateProduct = (item?: VerifiedItem) => {
        if (item) {
            setPrefillItem(item);
            const mappedCondition = conditionMapping[item.condition] || 'B';
            const matchedCategory = categories.find(c => c.slug === item.category);
            setFormData({
                title: [item.brand, item.model].filter(Boolean).join(' ') || '',
                description: '',
                category_id: matchedCategory?.id || '',
                brand: item.brand || '',
                model: item.model || '',
                processor: item.processor || '',
                ram: item.ram || '',
                storage: item.storage || '',
                condition: mappedCondition,
                quantity: item.quantity,
                price: item.quoted_price?.toString() || '',
                is_bulk_lot: false,
                lot_number: '',
            });
            setImages(item.images || []);
        } else {
            setPrefillItem(null);
            setFormData({
                title: '', description: '', category_id: '', brand: '', model: '',
                processor: '', ram: '', storage: '', condition: '', quantity: 1,
                price: '', is_bulk_lot: false, lot_number: '',
            });
            setImages([]);
        }
        setCreateOpen(true);
    };

    // ── Submit Product ──
    const handleCreateProduct = async () => {
        if (!formData.title || !formData.condition) {
            toast.error('Please fill in title and condition');
            return;
        }
        setSaving(true);
        try {
            const { error } = await supabase.from('products').insert({
                title: formData.title,
                description: formData.description || null,
                category_id: formData.category_id || null,
                brand: formData.brand || null,
                model: formData.model || null,
                processor: formData.processor || null,
                ram: formData.ram || null,
                storage: formData.storage || null,
                condition: formData.condition as ConditionGrade,
                quantity: formData.quantity,
                price: formData.price ? parseFloat(formData.price) : null,
                is_bulk_lot: formData.is_bulk_lot,
                lot_number: formData.lot_number || null,
                images: images,
                is_available: true,
            });
            if (error) throw error;

            // Mark verified item as listed
            if (prefillItem) {
                await supabase.from('verified_items').update({ is_listed: true }).eq('id', prefillItem.id);
            }

            toast.success('Product listed successfully!');
            setCreateOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error creating product:', error);
            toast.error('Failed to create product');
        } finally {
            setSaving(false);
        }
    };

    // ── Toggle product availability ──
    const toggleAvailability = async (product: Product) => {
        try {
            const { error } = await supabase.from('products')
                .update({ is_available: !product.is_available })
                .eq('id', product.id);
            if (error) throw error;
            toast.success(product.is_available ? 'Product hidden' : 'Product visible');
            fetchData();
        } catch (error) {
            toast.error('Failed to update');
        }
    };

    // ── Delete product ──
    const deleteProduct = async (id: string) => {
        if (!window.confirm('Delete this product?')) return;
        try {
            // Find the product to check if it's a lot
            const product = products.find(p => p.id === id);

            // If it's a lot product, also delete the lot and unlist its items
            if (product?.is_bulk_lot && product?.lot_number) {
                // Find the lot
                const { data: lot } = await supabase
                    .from('lots')
                    .select('id')
                    .eq('lot_number', product.lot_number)
                    .single();

                if (lot) {
                    // Get items linked to this lot and unlist them
                    const { data: lotItems } = await supabase
                        .from('lot_items')
                        .select('verified_item_id')
                        .eq('lot_id', lot.id);

                    if (lotItems && lotItems.length > 0) {
                        const itemIds = lotItems.map(li => li.verified_item_id).filter((id): id is string => id !== null);
                        if (itemIds.length > 0) {
                            await supabase.from('verified_items').update({ is_listed: false }).in('id', itemIds);
                        }
                    }

                    // Delete the lot (lot_items cascade via ON DELETE CASCADE)
                    await supabase.from('lots').delete().eq('id', lot.id);
                }
            }

            // Reset verified items that were listed from this specific product
            // (for non-lot products created from a verified item)
            await supabase.from('verified_items').update({ is_listed: false }).eq('is_listed', true);

            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
            toast.success('Product deleted');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    // ── Create Lot ──
    const handleCreateLot = async () => {
        if (!lotData.lot_number || !lotData.title) {
            toast.error('Please fill in lot number and title');
            return;
        }
        setLotSaving(true);
        try {
            // Create the lot
            const { data: lot, error: lotError } = await supabase.from('lots').insert({
                lot_number: lotData.lot_number,
                title: lotData.title,
                description: lotData.description || null,
                total_price: lotData.total_price ? parseFloat(lotData.total_price) : null,
                is_available: true,
            }).select().single();

            if (lotError) throw lotError;

            // Link selected verified items
            if (lotSelectedItems.length > 0) {
                const lotItemsInsert = lotSelectedItems.map(viId => ({
                    lot_id: lot.id,
                    verified_item_id: viId,
                    quantity: 1,
                }));
                await supabase.from('lot_items').insert(lotItemsInsert);

                // Mark items as listed
                await supabase.from('verified_items')
                    .update({ is_listed: true })
                    .in('id', lotSelectedItems);
            }

            // Create a product entry for the lot
            const { error: prodError } = await supabase.from('products').insert({
                title: `[LOT] ${lotData.title}`,
                description: lotData.description || `Bulk lot: ${lotData.lot_number}`,
                condition: 'B' as ConditionGrade,
                quantity: lotSelectedItems.length || 1,
                price: lotData.total_price ? parseFloat(lotData.total_price) : null,
                is_bulk_lot: true,
                lot_number: lotData.lot_number,
                is_available: true,
            });

            if (prodError) throw prodError;

            toast.success('Lot created and listed!');
            setLotCreateOpen(false);
            setLotData({ lot_number: '', title: '', description: '', total_price: '' });
            setLotSelectedItems([]);
            fetchData();
        } catch (error: any) {
            console.error('Error creating lot:', error);
            toast.error(error.message || 'Failed to create lot');
        } finally {
            setLotSaving(false);
        }
    };

    const toggleLotItem = (id: string) => {
        setLotSelectedItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const filteredProducts = products.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.brand?.toLowerCase().includes(search.toLowerCase()) ||
        p.model?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-950">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/admin" className="text-slate-400 hover:text-white transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Manage Inventory</h1>
                            <p className="text-slate-400">List products, manage verified items, and create lots</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setLotData({ lot_number: `LOT-${Date.now().toString(36).toUpperCase()}`, title: '', description: '', total_price: '' }); setLotSelectedItems([]); setLotCreateOpen(true); }}
                            className="border-white/20 text-white hover:bg-white/10"
                        >
                            <Layers className="w-4 h-4 mr-2" />
                            Create Lot
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => openCreateProduct()}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            New Product
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="bg-white/5 border border-white/10 mb-6">
                        <TabsTrigger value="listed" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-400">
                            Listed Products ({products.length})
                        </TabsTrigger>
                        <TabsTrigger value="verified" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-400">
                            Verified Items ({verifiedItems.length})
                        </TabsTrigger>
                        <TabsTrigger value="lots" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-400">
                            Lots/Bundles ({lots.length})
                        </TabsTrigger>
                    </TabsList>

                    {loading ? (
                        <Loader message="Loading inventory..." variant="page" />
                    ) : (
                        <>
                            {/* ── Listed Products Tab ── */}
                            <TabsContent value="listed">
                                <div className="mb-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <Input
                                            value={search}
                                            onChange={e => setSearch(e.target.value)}
                                            placeholder="Search products..."
                                            className="pl-10 bg-white/5 border-white/10 text-white"
                                        />
                                    </div>
                                </div>

                                {filteredProducts.length === 0 ? (
                                    <Card className="bg-white/5 border-white/10">
                                        <CardContent className="p-12 text-center">
                                            <Package className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold text-white mb-2">No products listed</h3>
                                            <p className="text-slate-400 text-sm mb-4">Create your first product listing or list a verified item.</p>
                                            <Button onClick={() => openCreateProduct()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                                <Plus className="w-4 h-4 mr-2" /> New Product
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="space-y-2">
                                        {filteredProducts.map(product => (
                                            <Card key={product.id} className="bg-white/5 border-white/10">
                                                <CardContent className="p-4">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                                            {product.images?.[0] ? (
                                                                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                                                                    <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                                                                </div>
                                                            ) : (
                                                                <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                                                    <Package className="w-5 h-5 text-slate-500" />
                                                                </div>
                                                            )}
                                                            <div className="min-w-0">
                                                                <span className="font-semibold text-white text-sm truncate block">{product.title}</span>
                                                                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                                                                    {product.brand && <span>{product.brand}</span>}
                                                                    {product.model && <span>· {product.model}</span>}
                                                                    <span>· Qty: {product.quantity}</span>
                                                                    {product.price && <span>· ${product.price}</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            {product.is_bulk_lot && (
                                                                <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                                                                    LOT
                                                                </Badge>
                                                            )}
                                                            <Badge variant="outline" className={`${conditionLabels[product.condition]?.color || ''} text-xs`}>
                                                                {conditionLabels[product.condition]?.label || product.condition}
                                                            </Badge>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white"
                                                                onClick={() => toggleAvailability(product)}>
                                                                {product.is_available ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300"
                                                                onClick={() => deleteProduct(product.id)}>
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            {/* ── Verified Items Tab ── */}
                            <TabsContent value="verified">
                                {verifiedItems.length === 0 ? (
                                    <Card className="bg-white/5 border-white/10">
                                        <CardContent className="p-12 text-center">
                                            <CheckCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold text-white mb-2">No unlisted verified items</h3>
                                            <p className="text-slate-400 text-sm">
                                                Items verified from submissions will appear here. Go to Submissions to review incoming requests.
                                            </p>
                                            <Link href="/admin/submissions">
                                                <Button variant="outline" className="mt-4 border-white/20 text-white hover:bg-white/10">
                                                    Go to Submissions
                                                </Button>
                                            </Link>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="space-y-2">
                                        {verifiedItems.map(item => (
                                            <Card key={item.id} className="bg-white/5 border-white/10">
                                                <CardContent className="p-4">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                                            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                                                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <span className="font-semibold text-white text-sm truncate block">
                                                                    {[item.brand, item.model].filter(Boolean).join(' ') || item.category}
                                                                </span>
                                                                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                                                                    <span className="capitalize">{item.category}</span>
                                                                    <span>· Qty: {item.quantity}</span>
                                                                    {item.quoted_price && <span>· ${item.quoted_price}</span>}
                                                                    {item.processor && <span>· {item.processor}</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {item.is_listed ? (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={async () => {
                                                                    await supabase.from('verified_items').update({ is_listed: false }).eq('id', item.id);
                                                                    toast.success('Item unlisted');
                                                                    fetchData();
                                                                }}
                                                                className="border-white/20 text-slate-300 hover:bg-white/10 shrink-0"
                                                            >
                                                                <EyeOff className="w-4 h-4 mr-1" />
                                                                Unlist
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => openCreateProduct(item)}
                                                                className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                                                            >
                                                                <ShoppingCart className="w-4 h-4 mr-1" />
                                                                List Item
                                                            </Button>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            {/* ── Lots Tab ── */}
                            <TabsContent value="lots">
                                {lots.length === 0 ? (
                                    <Card className="bg-white/5 border-white/10">
                                        <CardContent className="p-12 text-center">
                                            <Layers className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold text-white mb-2">No lots created</h3>
                                            <p className="text-slate-400 text-sm mb-4">
                                                Create a lot to bundle multiple items together for sale.
                                            </p>
                                            <Button
                                                onClick={() => { setLotData({ lot_number: `LOT-${Date.now().toString(36).toUpperCase()}`, title: '', description: '', total_price: '' }); setLotSelectedItems([]); setLotCreateOpen(true); }}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                            >
                                                <Layers className="w-4 h-4 mr-2" /> Create First Lot
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="space-y-2">
                                        {lots.map(lot => (
                                            <Card key={lot.id} className="bg-white/5 border-white/10">
                                                <CardContent className="p-4">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                                                                <Layers className="w-5 h-5 text-purple-400" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <span className="font-semibold text-white text-sm truncate block">{lot.title}</span>
                                                                <div className="text-xs text-slate-400 mt-0.5">
                                                                    {lot.lot_number}
                                                                    {lot.total_price && <span> · ${lot.total_price}</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <Badge variant="outline" className={lot.is_available
                                                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs'
                                                                : 'bg-red-500/20 text-red-400 border-red-500/30 text-xs'
                                                            }>
                                                                {lot.is_available ? 'Active' : 'Inactive'}
                                                            </Badge>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-red-400 hover:text-red-300"
                                                                onClick={async () => {
                                                                    if (!window.confirm('Delete this lot and its associated product listing?')) return;
                                                                    try {
                                                                        // Unlist verified items in this lot
                                                                        const { data: lotItems } = await supabase
                                                                            .from('lot_items')
                                                                            .select('verified_item_id')
                                                                            .eq('lot_id', lot.id);

                                                                        if (lotItems && lotItems.length > 0) {
                                                                            const itemIds = lotItems.map(li => li.verified_item_id).filter((id): id is string => id !== null);
                                                                            if (itemIds.length > 0) {
                                                                                await supabase.from('verified_items').update({ is_listed: false }).in('id', itemIds);
                                                                            }
                                                                        }

                                                                        // Delete associated product listing
                                                                        if (lot.lot_number) {
                                                                            await supabase.from('products').delete().eq('lot_number', lot.lot_number);
                                                                        }

                                                                        // Delete the lot (lot_items cascade)
                                                                        await supabase.from('lots').delete().eq('id', lot.id);
                                                                        toast.success('Lot deleted');
                                                                        fetchData();
                                                                    } catch (error) {
                                                                        toast.error('Failed to delete lot');
                                                                    }
                                                                }}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                        </>
                    )}
                </Tabs>

                {/* ── Create Product Dialog ── */}
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogContent className="bg-slate-900 border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{prefillItem ? 'List Verified Item' : 'Create New Product'}</DialogTitle>
                            <DialogDescription className="text-slate-400">
                                {prefillItem
                                    ? 'Review pre-filled details and adjust before listing.'
                                    : 'Fill in product details to create a new inventory listing.'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 mt-2">
                            <div>
                                <Label className="text-slate-400 text-xs">Title *</Label>
                                <Input
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Dell Latitude 5520 - Intel i5"
                                    className="bg-white/5 border-white/10 text-white text-sm"
                                />
                            </div>

                            <div>
                                <Label className="text-slate-400 text-xs">Description</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Product description..."
                                    className="bg-white/5 border-white/10 text-white text-sm min-h-[80px]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-slate-400 text-xs">Category</Label>
                                    <Select value={formData.category_id} onValueChange={v => setFormData({ ...formData, category_id: v })}>
                                        <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm">
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map(cat => (
                                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-slate-400 text-xs">Condition *</Label>
                                    <Select value={formData.condition} onValueChange={v => setFormData({ ...formData, condition: v as ConditionGrade })}>
                                        <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm">
                                            <SelectValue placeholder="Select condition" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {conditionOptions.map(opt => (
                                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-slate-400 text-xs">Brand</Label>
                                    <Input value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                        placeholder="e.g., Dell" className="bg-white/5 border-white/10 text-white text-sm" />
                                </div>
                                <div>
                                    <Label className="text-slate-400 text-xs">Model</Label>
                                    <Input value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })}
                                        placeholder="e.g., Latitude 5520" className="bg-white/5 border-white/10 text-white text-sm" />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label className="text-slate-400 text-xs">Processor</Label>
                                    <Input value={formData.processor} onChange={e => setFormData({ ...formData, processor: e.target.value })}
                                        placeholder="e.g., Intel i5" className="bg-white/5 border-white/10 text-white text-sm" />
                                </div>
                                <div>
                                    <Label className="text-slate-400 text-xs">RAM</Label>
                                    <Input value={formData.ram} onChange={e => setFormData({ ...formData, ram: e.target.value })}
                                        placeholder="e.g., 16GB DDR4" className="bg-white/5 border-white/10 text-white text-sm" />
                                </div>
                                <div>
                                    <Label className="text-slate-400 text-xs">Storage</Label>
                                    <Input value={formData.storage} onChange={e => setFormData({ ...formData, storage: e.target.value })}
                                        placeholder="e.g., 256GB SSD" className="bg-white/5 border-white/10 text-white text-sm" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-slate-400 text-xs">Price ($)</Label>
                                    <Input type="number" step="0.01" value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        placeholder="Leave blank for 'Contact'" className="bg-white/5 border-white/10 text-white text-sm" />
                                </div>
                                <div>
                                    <Label className="text-slate-400 text-xs">Quantity</Label>
                                    <Input type="number" min={1} value={formData.quantity}
                                        onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                                        className="bg-white/5 border-white/10 text-white text-sm" />
                                </div>
                            </div>

                            {/* Image Upload */}
                            <div>
                                <Label className="text-slate-400 text-xs mb-2 block">Images</Label>
                                <div
                                    {...getRootProps()}
                                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/20 hover:border-white/40'
                                        }`}
                                >
                                    <input {...getInputProps()} />
                                    {uploadingImages ? (
                                        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin mx-auto" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-1">
                                            <ImageIcon className="w-6 h-6 text-slate-400" />
                                            <p className="text-slate-400 text-xs">Drag images or click to browse</p>
                                        </div>
                                    )}
                                </div>
                                {images.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {images.map((url, i) => (
                                            <div key={i} className="relative group w-16 h-16">
                                                <img src={url} alt="" className="w-full h-full object-cover rounded-lg" />
                                                <button type="button" onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                                                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <X className="w-3 h-3 text-white" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="mt-4">
                            <Button variant="outline" onClick={() => setCreateOpen(false)}
                                className="border-white/20 text-white hover:bg-white/10">Cancel</Button>
                            <Button onClick={handleCreateProduct} disabled={saving}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                {prefillItem ? 'List Item' : 'Create Product'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* ── Create Lot Dialog ── */}
                <Dialog open={lotCreateOpen} onOpenChange={setLotCreateOpen}>
                    <DialogContent className="bg-slate-900 border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create Lot / Bundle</DialogTitle>
                            <DialogDescription className="text-slate-400">
                                Group multiple items together for sale as a single lot.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 mt-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-slate-400 text-xs">Lot Number *</Label>
                                    <Input value={lotData.lot_number} onChange={e => setLotData({ ...lotData, lot_number: e.target.value })}
                                        className="bg-white/5 border-white/10 text-white text-sm" />
                                </div>
                                <div>
                                    <Label className="text-slate-400 text-xs">Bundle Price ($)</Label>
                                    <Input type="number" step="0.01" value={lotData.total_price}
                                        onChange={e => setLotData({ ...lotData, total_price: e.target.value })}
                                        placeholder="Total lot price" className="bg-white/5 border-white/10 text-white text-sm" />
                                </div>
                            </div>

                            <div>
                                <Label className="text-slate-400 text-xs">Lot Title *</Label>
                                <Input value={lotData.title} onChange={e => setLotData({ ...lotData, title: e.target.value })}
                                    placeholder="e.g., 50x Dell Latitude Mixed Lot"
                                    className="bg-white/5 border-white/10 text-white text-sm" />
                            </div>

                            <div>
                                <Label className="text-slate-400 text-xs">Description</Label>
                                <Textarea value={lotData.description} onChange={e => setLotData({ ...lotData, description: e.target.value })}
                                    placeholder="Describe the lot contents..."
                                    className="bg-white/5 border-white/10 text-white text-sm min-h-[80px]" />
                            </div>

                            {/* Verified Items to add */}
                            <div>
                                <Label className="text-slate-400 text-xs mb-2 block">
                                    Add Verified Items to Lot ({lotSelectedItems.length} selected)
                                </Label>
                                {verifiedItems.length === 0 ? (
                                    <p className="text-slate-500 text-xs">No unlisted verified items available. You can still create the lot and add items later.</p>
                                ) : (
                                    <div className="space-y-1 max-h-48 overflow-y-auto rounded-lg border border-white/10 p-2">
                                        {verifiedItems.map(item => (
                                            <div
                                                key={item.id}
                                                onClick={() => toggleLotItem(item.id)}
                                                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${lotSelectedItems.includes(item.id)
                                                    ? 'bg-emerald-500/10 border border-emerald-500/30'
                                                    : 'hover:bg-white/5 border border-transparent'
                                                    }`}
                                            >
                                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${lotSelectedItems.includes(item.id)
                                                    ? 'border-emerald-500 bg-emerald-500'
                                                    : 'border-white/20'
                                                    }`}>
                                                    {lotSelectedItems.includes(item.id) && (
                                                        <CheckCircle className="w-3 h-3 text-white" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="text-white text-sm truncate block">
                                                        {[item.brand, item.model].filter(Boolean).join(' ') || item.category}
                                                    </span>
                                                    <span className="text-xs text-slate-400">
                                                        {item.category} · Qty: {item.quantity}
                                                        {item.quoted_price && ` · $${item.quoted_price}`}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="mt-4">
                            <Button variant="outline" onClick={() => setLotCreateOpen(false)}
                                className="border-white/20 text-white hover:bg-white/10">Cancel</Button>
                            <Button onClick={handleCreateLot} disabled={lotSaving}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                {lotSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Layers className="w-4 h-4 mr-2" />}
                                Create Lot
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}

export default function AdminInventoryPage() {
    return (
        <ProtectedRoute requireAdmin>
            <InventoryManagementContent />
        </ProtectedRoute>
    );
}
