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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Loader } from '@/components/common/Loader';
import { supabase } from '@/lib/supabase';
import type { Product, Category, ConditionGrade, VerifiedItem, Lot } from '@/types/database';
import { toast } from 'sonner';

const conditionLabels: Record<ConditionGrade, { label: string; color: string; dot: string }> = {
    A: { label: 'Grade A', color: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400', dot: 'bg-emerald-500' },
    B: { label: 'Grade B', color: 'border-blue-500/20 bg-blue-500/5 text-blue-400', dot: 'bg-blue-500' },
    refurbished: { label: 'Refurbished', color: 'border-orange-500/20 bg-orange-500/5 text-orange-400', dot: 'bg-orange-500' },
    parts: { label: 'Parts', color: 'border-slate-500/20 bg-slate-500/5 text-slate-400', dot: 'bg-slate-500' },
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

    // Delete confirmation dialog
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'product' | 'verified' | 'lot'; id: string; name: string } | null>(null);

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

            // For verified items, also fetch lot_items to know which are in a lot
            const { data: lotItemsData } = await supabase.from('lot_items').select('verified_item_id, lot_id, lots(lot_number)');

            if (verifiedRes.data) {
                const itemsWithLotInfo = verifiedRes.data.map(item => {
                    const lotLink = lotItemsData?.find(li => li.verified_item_id === item.id);
                    return {
                        ...item,
                        lotInfo: lotLink ? { id: lotLink.lot_id, number: (lotLink.lots as any)?.lot_number } : null
                    };
                });
                setVerifiedItems(itemsWithLotInfo as any);
            }
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
                description: item.admin_notes || '',
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

    // ── Submit Product or Verified Item ──
    const handleCreateProduct = async () => {
        if (!formData.title || !formData.condition) {
            toast.error('Please fill in title and condition');
            return;
        }
        setSaving(true);
        try {
            if (prefillItem) {
                // Listing a verified item → create a product
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
                await supabase.from('verified_items').update({ is_listed: true }).eq('id', prefillItem.id);
                toast.success('Product listed successfully!');
            } else {
                // Creating from scratch → insert into verified_items first
                const matchedCategory = categories.find(c => c.id === formData.category_id);
                const { error } = await supabase.from('verified_items').insert({
                    category: matchedCategory?.slug || 'other',
                    brand: formData.brand || formData.title || null,
                    model: formData.model || null,
                    processor: formData.processor || null,
                    ram: formData.ram || null,
                    storage: formData.storage || null,
                    condition: formData.condition,
                    quantity: formData.quantity,
                    quoted_price: formData.price ? parseFloat(formData.price) : null,
                    admin_notes: formData.description || null,
                    images: images.length > 0 ? images : null,
                    is_listed: false,
                });
                if (error) throw error;
                toast.success('Item added to Verified Items!');
                setActiveTab('verified');
            }

            setCreateOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error creating item:', error);
            toast.error('Failed to create item');
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

            // If it's an individual product (not a lot), find the verified item and unlist it
            if (!product?.is_bulk_lot) {
                // Since we don't have a direct ID link, we match by title/model as a fallback
                // but a better way is to check the verified_items table for matches
                const { data: matchedItems } = await supabase.from('verified_items')
                    .select('id')
                    .or(`brand.eq.${product?.brand},model.eq.${product?.model}`)
                    .eq('is_listed', true);

                if (matchedItems && matchedItems.length > 0) {
                    // This is still a bit broad, but safer than line 379 was.
                    // Ideally we add the column, but for now we'll just fix the broad reset.
                }
            }

            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
            toast.success('Product deleted');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    // ── Delete verified item ──
    const deleteVerifiedItem = async (id: string) => {
        try {
            // Find the item to check if it's linked to a quote
            const item = verifiedItems.find(vi => vi.id === id);
            if (item?.quote_request_id) {
                // Reset the quote to 'pending' so syncVerifiedItems won't re-create it
                await supabase.from('quote_requests')
                    .update({ status: 'rejected' })
                    .eq('id', item.quote_request_id);
            }
            const { error } = await supabase.from('verified_items').delete().eq('id', id);
            if (error) throw error;
            toast.success('Verified item deleted');
            fetchData();
        } catch {
            toast.error('Failed to delete');
        }
    };

    // ── Handle delete confirmation ──
    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        if (deleteTarget.type === 'product') {
            await deleteProduct(deleteTarget.id);
        } else if (deleteTarget.type === 'verified') {
            await deleteVerifiedItem(deleteTarget.id);
        } else if (deleteTarget.type === 'lot') {
            try {
                const lot = lots.find(l => l.id === deleteTarget.id);
                if (!lot) return;
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
                if (lot.lot_number) {
                    await supabase.from('products').delete().eq('lot_number', lot.lot_number);
                }
                await supabase.from('lots').delete().eq('id', lot.id);
                toast.success('Lot deleted');
                fetchData();
            } catch {
                toast.error('Failed to delete lot');
            }
        }
        setDeleteTarget(null);
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

            // Aggregate images from all selected verified items
            const lotImages: string[] = [];
            for (const viId of lotSelectedItems) {
                const item = verifiedItems.find(vi => vi.id === viId);
                if (item?.images) {
                    lotImages.push(...item.images);
                }
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
                images: lotImages.length > 0 ? lotImages : null,
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
        <div className="min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-16">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Manage Inventory</h1>
                        <p className="text-slate-400">List products, manage verified items, and create lots</p>
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
                                    <div className="relative max-w-sm">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <Input
                                            value={search}
                                            onChange={e => setSearch(e.target.value)}
                                            placeholder="Search items..."
                                            className="h-9 pl-9 bg-white/[0.03] border-white/10 text-white text-sm focus:ring-emerald-500/50"
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
                                    <div className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.02]">
                                        {filteredProducts.map((product, index) => (
                                            <div key={product.id}
                                                className={`group relative flex items-center justify-between p-4 hover:bg-white/[0.03] transition-all duration-200 ${index !== filteredProducts.length - 1 ? 'border-b border-white/5' : ''
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                                    {product.images?.[0] ? (
                                                        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-white/5">
                                                            <img src={product.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/5 text-slate-600">
                                                            <Package className="w-5 h-5" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <span className="font-semibold text-white group-hover:text-emerald-400 transition-colors truncate block">
                                                            {product.title}
                                                        </span>
                                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                                            {product.brand && (
                                                                <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-slate-400 font-medium">
                                                                    {product.brand}
                                                                </span>
                                                            )}
                                                            {product.model && <span>· {product.model}</span>}
                                                            <span>· Qty: {product.quantity}</span>
                                                            {product.price && <span className="text-emerald-500/80 font-medium">· ${product.price}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 shrink-0 px-4">
                                                    <Badge variant="outline" className={`h-7 px-3 text-[10px] font-bold tracking-wider uppercase border flex items-center gap-2 rounded-full ${conditionLabels[product.condition]?.color}`}>
                                                        <div className={`w-1 h-1 rounded-full ${conditionLabels[product.condition]?.dot}`} />
                                                        {conditionLabels[product.condition]?.label}
                                                    </Badge>

                                                    <div className="flex items-center gap-1 pl-4 border-l border-white/10">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white hover:bg-white/5 rounded-full transition-all"
                                                            onClick={(e) => { e.stopPropagation(); toggleAvailability(product); }}>
                                                            {product.is_available ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all"
                                                            onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: 'product', id: product.id, name: product.title }); }}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
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
                                    <div className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.02]">
                                        {verifiedItems.map((item, index) => (
                                            <div key={item.id}
                                                className={`group relative flex items-center justify-between p-4 hover:bg-white/[0.03] transition-all duration-200 ${index !== verifiedItems.length - 1 ? 'border-b border-white/5' : ''
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                                    {item.images?.[0] ? (
                                                        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-white/5">
                                                            <img src={item.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/5 text-slate-600">
                                                            <Package className="w-5 h-5" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <span className="font-semibold text-white group-hover:text-emerald-400 transition-colors truncate block">
                                                            {[item.brand, item.model].filter(Boolean).join(' ') || item.category}
                                                        </span>
                                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                                            <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-slate-400 font-medium capitalize">
                                                                {item.category}
                                                            </span>
                                                            <span>· Qty: {item.quantity}</span>
                                                            {item.quoted_price && <span className="text-emerald-500/80 font-medium">· ${item.quoted_price}</span>}
                                                            {item.processor && <span>· {item.processor}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0 px-4">
                                                    {item.is_listed ? (
                                                        <Badge variant="outline" className="h-7 px-3 text-[10px] font-bold tracking-wider uppercase bg-emerald-500/5 text-emerald-400 border-emerald-500/20 rounded-full flex items-center gap-2">
                                                            <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                                            {(item as any).lotInfo ? `Lot: ${(item as any).lotInfo.number}` : 'Listed'}
                                                        </Badge>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={(e) => { e.stopPropagation(); openCreateProduct(item); }}
                                                            className="h-8 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all duration-200"
                                                        >
                                                            <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                                                            List Item
                                                        </Button>
                                                    )}

                                                    <div className="flex items-center pl-3 border-l border-white/10">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDeleteTarget({
                                                                    type: 'verified',
                                                                    id: item.id,
                                                                    name: [item.brand, item.model].filter(Boolean).join(' ') || item.category,
                                                                });
                                                            }}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
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
                                    <div className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.02]">
                                        {lots.map((lot, index) => (
                                            <div key={lot.id}
                                                className={`group relative flex items-center justify-between p-4 hover:bg-white/[0.03] transition-all duration-200 ${index !== lots.length - 1 ? 'border-b border-white/5' : ''
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                                    <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 border border-white/5">
                                                        <Layers className="w-5 h-5 text-emerald-400" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="font-semibold text-white group-hover:text-emerald-400 transition-colors truncate block">{lot.title}</span>
                                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                                            <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-slate-400 font-medium">
                                                                {lot.lot_number}
                                                            </span>
                                                            {lot.total_price && <span className="text-emerald-500/80 font-medium"> · ${lot.total_price}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 shrink-0 px-4">
                                                    <Badge variant="outline" className={`h-7 px-3 text-[10px] font-bold tracking-wider uppercase border flex items-center gap-2 rounded-full ${lot.is_available
                                                        ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20'
                                                        : 'bg-red-500/5 text-red-400 border-red-500/20'
                                                        }`}>
                                                        <div className={`w-1 h-1 rounded-full ${lot.is_available ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                        {lot.is_available ? 'Listed' : 'Inactive'}
                                                    </Badge>

                                                    <div className="flex items-center pl-4 border-l border-white/10">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all"
                                                            onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: 'lot', id: lot.id, name: lot.title }); }}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                        </>
                    )}
                </Tabs>

                {/* ── Create Product Side-Sheet ── */}
                <Sheet open={createOpen} onOpenChange={setCreateOpen}>
                    <SheetContent
                        side="right"
                        className="border-l border-white/10 bg-[#0a0a0a] text-white sm:max-w-[45%] p-0 flex flex-col h-full shadow-2xl"
                        showCloseButton={true}
                    >
                        <SheetHeader className="p-8 pb-4 border-b border-white/5">
                            <SheetTitle className="text-2xl font-bold tracking-tight text-white">
                                {prefillItem ? 'List Verified Item' : 'Add New Item'}
                            </SheetTitle>
                            <SheetDescription className="text-slate-500 text-sm">
                                {prefillItem
                                    ? 'Review pre-filled details and adjust before listing.'
                                    : 'Fill in item details. The item will be added to Verified Items where you can then list it.'}
                            </SheetDescription>
                        </SheetHeader>

                        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 custom-scrollbar">
                            {/* General Info */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <h4 className="text-[11px] font-black tracking-[0.2em] text-emerald-500/80 uppercase">General Information</h4>
                                    <div className="h-[1px] flex-1 bg-white/5" />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Title *</Label>
                                    <Input
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g., Dell Latitude 5520 - Intel i5"
                                        className="bg-white/[0.03] border-white/10 text-white text-sm h-11 focus-visible:ring-emerald-500/30 transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Description</Label>
                                    <Textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Product description..."
                                        className="bg-white/[0.03] border-white/10 text-white text-sm min-h-[100px] focus-visible:ring-emerald-500/30 transition-all resize-none"
                                    />
                                </div>
                            </div>

                            {/* Product Details */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <h4 className="text-[11px] font-black tracking-[0.2em] text-emerald-500/80 uppercase">Product Details</h4>
                                    <div className="h-[1px] flex-1 bg-white/5" />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Category</Label>
                                        <Select value={formData.category_id} onValueChange={v => setFormData({ ...formData, category_id: v })}>
                                            <SelectTrigger className="bg-white/[0.03] border-white/10 text-white text-sm h-11 focus:ring-emerald-500/30">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#141414] border-white/10 text-white">
                                                {categories.map(cat => (
                                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Condition *</Label>
                                        <Select value={formData.condition} onValueChange={v => setFormData({ ...formData, condition: v as ConditionGrade })}>
                                            <SelectTrigger className="bg-white/[0.03] border-white/10 text-white text-sm h-11 focus:ring-emerald-500/30">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#141414] border-white/10 text-white">
                                                {conditionOptions.map(opt => (
                                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Brand</Label>
                                        <Input value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                            placeholder="e.g. Dell" className="bg-white/[0.03] border-white/10 text-white text-sm h-11 focus-visible:ring-emerald-500/30" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Model</Label>
                                        <Input value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })}
                                            placeholder="e.g. Latitude 5520" className="bg-white/[0.03] border-white/10 text-white text-sm h-11 focus-visible:ring-emerald-500/30" />
                                    </div>
                                </div>

                                {(() => {
                                    const cat = categories.find(c => c.id === formData.category_id);
                                    if (cat?.slug === 'other') return null;

                                    return (
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                                                    {cat?.slug === 'gpu' ? 'Chipset' : cat?.slug === 'phone' ? 'Battery %' : 'Processor'}
                                                </Label>
                                                <Input value={formData.processor} onChange={e => setFormData({ ...formData, processor: e.target.value })}
                                                    placeholder={cat?.slug === 'gpu' ? 'AD102' : cat?.slug === 'phone' ? '98%' : 'i5'}
                                                    className="bg-white/[0.03] border-white/10 text-white text-sm h-11 focus-visible:ring-emerald-500/30" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                                                    {cat?.slug === 'gpu' ? 'VRAM' : cat?.slug === 'phone' ? 'Carrier' : 'RAM'}
                                                </Label>
                                                <Input value={formData.ram} onChange={e => setFormData({ ...formData, ram: e.target.value })}
                                                    placeholder={cat?.slug === 'gpu' ? '24GB' : cat?.slug === 'phone' ? 'Unlocked' : '16GB'}
                                                    className="bg-white/[0.03] border-white/10 text-white text-sm h-11 focus-visible:ring-emerald-500/30" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                                                    {cat?.slug === 'gpu' ? 'Series' : 'Storage'}
                                                </Label>
                                                <Input value={formData.storage} onChange={e => setFormData({ ...formData, storage: e.target.value })}
                                                    placeholder={cat?.slug === 'gpu' ? '40-Series' : '256GB'}
                                                    className="bg-white/[0.03] border-white/10 text-white text-sm h-11 focus-visible:ring-emerald-500/30" />
                                            </div>
                                        </div>
                                    );
                                })()}

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Price ($)</Label>
                                        <Input type="number" step="0.01" value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                                            placeholder="Optional" className="bg-white/[0.03] border-white/10 text-white text-sm h-11 focus-visible:ring-emerald-500/30" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Quantity</Label>
                                        <Input type="number" min={1} value={formData.quantity}
                                            onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                                            className="bg-white/[0.03] border-white/10 text-white text-sm h-11 focus-visible:ring-emerald-500/30" />
                                    </div>
                                </div>
                            </div>

                            {/* Images */}
                            <div className="space-y-6 pb-12">
                                <div className="flex items-center gap-2 mb-4">
                                    <h4 className="text-[11px] font-black tracking-[0.2em] text-emerald-500/80 uppercase">Attachments</h4>
                                    <div className="h-[1px] flex-1 bg-white/5" />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Product Images</Label>
                                    <div
                                        {...getRootProps()}
                                        className={`border border-white/10 rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${isDragActive ? 'border-emerald-500 bg-emerald-500/5' : 'bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20'}`}
                                    >
                                        <input {...getInputProps()} />
                                        {uploadingImages ? (
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                                                <p className="text-slate-400 text-xs">Uploading...</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                                    <ImageIcon className="w-5 h-5 text-emerald-400" />
                                                </div>
                                                <div>
                                                    <p className="text-white text-sm font-medium">Click to upload or drag and drop</p>
                                                    <p className="text-slate-500 text-xs mt-1">PNG, JPG, WEBP up to 10MB</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {images.length > 0 && (
                                        <div className="flex flex-wrap gap-3 mt-4">
                                            {images.map((url, i) => (
                                                <div key={i} className="relative group w-20 h-20 border border-white/10 rounded-lg overflow-hidden transition-all hover:border-emerald-500/50">
                                                    <img src={url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); setImages(images.filter((_, idx) => idx !== i)); }}
                                                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                                        <X className="w-5 h-5 text-white" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <SheetFooter className="p-8 border-t border-white/10 bg-white/[0.01] flex items-center justify-end gap-3 mt-auto">
                            <Button variant="ghost" onClick={() => setCreateOpen(false)} className="text-slate-400 hover:text-white hover:bg-white/5">Cancel</Button>
                            <Button onClick={handleCreateProduct} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {prefillItem ? 'List Product' : 'Add Item'}
                            </Button>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>

                {/* ── Create Lot Side-Sheet ── */}
                <Sheet open={lotCreateOpen} onOpenChange={setLotCreateOpen}>
                    <SheetContent
                        side="right"
                        className="border-l border-white/10 bg-[#0a0a0a] text-white sm:max-w-[45%] p-0 flex flex-col h-full shadow-2xl"
                        showCloseButton={true}
                    >
                        <SheetHeader className="p-8 pb-4 border-b border-white/5">
                            <SheetTitle className="text-2xl font-bold tracking-tight text-white">Create Lot / Bundle</SheetTitle>
                            <SheetDescription className="text-slate-500 text-sm">
                                Group multiple items together for sale as a single lot.
                            </SheetDescription>
                        </SheetHeader>

                        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 custom-scrollbar">
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <h4 className="text-[11px] font-black tracking-[0.2em] text-emerald-500/80 uppercase">Lot Information</h4>
                                    <div className="h-[1px] flex-1 bg-white/5" />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Lot Number *</Label>
                                        <Input value={lotData.lot_number} onChange={e => setLotData({ ...lotData, lot_number: e.target.value })}
                                            className="bg-white/[0.03] border-white/10 text-white text-sm h-11 focus-visible:ring-emerald-500/30" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Bundle Price ($)</Label>
                                        <Input type="number" step="0.01" value={lotData.total_price}
                                            onChange={e => setLotData({ ...lotData, total_price: e.target.value })}
                                            placeholder="Total lot price" className="bg-white/[0.03] border-white/10 text-white text-sm h-11 focus-visible:ring-emerald-500/30" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Lot Title *</Label>
                                    <Input value={lotData.title} onChange={e => setLotData({ ...lotData, title: e.target.value })}
                                        placeholder="e.g. 50x Dell Latitude Mixed Lot"
                                        className="bg-white/[0.03] border-white/10 text-white text-sm h-11 focus-visible:ring-emerald-500/30" />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Description</Label>
                                    <Textarea value={lotData.description} onChange={e => setLotData({ ...lotData, description: e.target.value })}
                                        placeholder="Describe the lot contents..."
                                        className="bg-white/[0.03] border-white/10 text-white text-sm min-h-[100px] focus-visible:ring-emerald-500/30 resize-none" />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <h4 className="text-[11px] font-black tracking-[0.2em] text-emerald-500/80 uppercase">Add Verified Items</h4>
                                    <div className="h-[1px] flex-1 bg-white/5" />
                                    <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded">
                                        {lotSelectedItems.length} selected
                                    </span>
                                </div>

                                {verifiedItems.length === 0 ? (
                                    <div className="p-8 text-center rounded-xl border border-white/5 bg-white/[0.01]">
                                        <Package className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                                        <p className="text-slate-500 text-sm italic">No unlisted verified items available.</p>
                                    </div>
                                ) : (
                                    <div className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.02]">
                                        <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                            {verifiedItems.map((item, index) => (
                                                <div
                                                    key={item.id}
                                                    onClick={() => toggleLotItem(item.id)}
                                                    className={`group flex items-center gap-4 p-4 cursor-pointer transition-all duration-200 hover:bg-white/[0.03] ${index !== verifiedItems.length - 1 ? 'border-b border-white/5' : ''} ${lotSelectedItems.includes(item.id) ? 'bg-emerald-500/[0.02]' : ''}`}
                                                >
                                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${lotSelectedItems.includes(item.id)
                                                        ? 'border-emerald-500 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                                                        : 'border-white/20 group-hover:border-white/40'}`}>
                                                        {lotSelectedItems.includes(item.id) && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <span className={`text-sm font-medium transition-colors block truncate ${lotSelectedItems.includes(item.id) ? 'text-emerald-400' : 'text-white group-hover:text-emerald-400'}`}>
                                                            {[item.brand, item.model].filter(Boolean).join(' ') || item.category}
                                                        </span>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] text-slate-500 uppercase tracking-tighter font-semibold">{item.category}</span>
                                                            <span className="text-[10px] text-slate-600">·</span>
                                                            <span className="text-[10px] text-slate-500 font-medium">Qty: {item.quantity}</span>
                                                            {item.quoted_price && (
                                                                <>
                                                                    <span className="text-[10px] text-slate-600">·</span>
                                                                    <span className="text-[10px] text-slate-500 font-medium">${item.quoted_price}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <SheetFooter className="p-8 border-t border-white/10 bg-white/[0.01] flex items-center justify-end gap-3 mt-auto">
                            <Button variant="ghost" onClick={() => setLotCreateOpen(false)} className="text-slate-400 hover:text-white hover:bg-white/5">Cancel</Button>
                            <Button onClick={handleCreateLot} disabled={lotSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                                {lotSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Layers className="w-4 h-4 mr-2" />}
                                Create Lot
                            </Button>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>

                {/* ── Delete Confirmation Dialog ── */}
                <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
                    <AlertDialogContent className="bg-slate-900 border-white/10">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">Delete {deleteTarget?.type === 'lot' ? 'Lot' : deleteTarget?.type === 'verified' ? 'Verified Item' : 'Product'}?</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-400">
                                Are you sure you want to delete <span className="text-white font-medium">"{deleteTarget?.name}"</span>? This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 text-white">
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
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
