'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Pencil, Trash2, Eye, EyeOff, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Loader } from '@/components/common/Loader';
import { supabase } from '@/lib/supabase';
import type { Product, ConditionGrade } from '@/types/database';
import { toast } from 'sonner';

const conditionLabels: Record<ConditionGrade, { label: string; color: string }> = {
    A: { label: 'Grade A', color: 'bg-emerald-500/20 text-emerald-400' },
    B: { label: 'Grade B', color: 'bg-blue-500/20 text-blue-400' },
    refurbished: { label: 'Refurb', color: 'bg-purple-500/20 text-purple-400' },
    parts: { label: 'Parts', color: 'bg-orange-500/20 text-orange-400' },
};

function ProductsContent() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; product: Product | null }>({
        open: false,
        product: null,
    });
    const [deleting, setDeleting] = useState(false);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*, category:categories(*)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const toggleAvailability = async (product: Product) => {
        try {
            const { error } = await supabase
                .from('products')
                .update({ is_available: !product.is_available })
                .eq('id', product.id);

            if (error) throw error;

            setProducts(products.map((p) =>
                p.id === product.id ? { ...p, is_available: !p.is_available } : p
            ));
            toast.success(`Product ${product.is_available ? 'hidden' : 'shown'}`);
        } catch (error) {
            console.error('Error updating product:', error);
            toast.error('Failed to update product');
        }
    };

    const deleteProduct = async () => {
        if (!deleteDialog.product) return;

        setDeleting(true);
        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', deleteDialog.product.id);

            if (error) throw error;

            setProducts(products.filter((p) => p.id !== deleteDialog.product!.id));
            toast.success('Product deleted');
            setDeleteDialog({ open: false, product: null });
        } catch (error) {
            console.error('Error deleting product:', error);
            toast.error('Failed to delete product');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/admin" className="text-slate-400 hover:text-white transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Products</h1>
                            <p className="text-slate-400">Manage your inventory listings</p>
                        </div>
                    </div>
                    <Link href="/admin/products/new">
                        <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Product
                        </Button>
                    </Link>
                </div>

                {/* Products Table */}
                <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="p-8">
                                <Loader message="Loading products..." />
                            </div>
                        ) : products.length === 0 ? (
                            <div className="p-16 text-center">
                                <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-white mb-2">No products yet</h3>
                                <p className="text-slate-400 mb-6">Add your first product to get started.</p>
                                <Link href="/admin/products/new">
                                    <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Product
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-white/10 hover:bg-transparent">
                                        <TableHead className="text-slate-400">Product</TableHead>
                                        <TableHead className="text-slate-400">Category</TableHead>
                                        <TableHead className="text-slate-400">Condition</TableHead>
                                        <TableHead className="text-slate-400">Price</TableHead>
                                        <TableHead className="text-slate-400">Qty</TableHead>
                                        <TableHead className="text-slate-400">Status</TableHead>
                                        <TableHead className="text-slate-400 text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {products.map((product) => {
                                        const condition = conditionLabels[product.condition];
                                        return (
                                            <TableRow key={product.id} className="border-white/10 hover:bg-white/5">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden">
                                                            {product.images && product.images[0] ? (
                                                                <img
                                                                    src={product.images[0]}
                                                                    alt=""
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <Package className="w-5 h-5 text-slate-600" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-medium line-clamp-1">{product.title}</p>
                                                            <p className="text-slate-400 text-sm line-clamp-1">
                                                                {product.brand} {product.model}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-slate-300">
                                                    {product.category?.name || '—'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={`${condition.color} border-0`}>
                                                        {condition.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-slate-300">
                                                    {product.price ? `$${product.price.toFixed(2)}` : '—'}
                                                </TableCell>
                                                <TableCell className="text-slate-300">{product.quantity}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            product.is_available
                                                                ? 'bg-emerald-500/20 text-emerald-400 border-0'
                                                                : 'bg-slate-500/20 text-slate-400 border-0'
                                                        }
                                                    >
                                                        {product.is_available ? 'Visible' : 'Hidden'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => toggleAvailability(product)}
                                                            className="text-slate-400 hover:text-white"
                                                        >
                                                            {product.is_available ? (
                                                                <EyeOff className="w-4 h-4" />
                                                            ) : (
                                                                <Eye className="w-4 h-4" />
                                                            )}
                                                        </Button>
                                                        <Link href={`/admin/products/${product.id}/edit`}>
                                                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                                                                <Pencil className="w-4 h-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setDeleteDialog({ open: true, product })}
                                                            className="text-slate-400 hover:text-red-400"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Delete Dialog */}
                <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, product: null })}>
                    <DialogContent className="bg-slate-800 border-white/10">
                        <DialogHeader>
                            <DialogTitle className="text-white">Delete Product</DialogTitle>
                            <DialogDescription className="text-slate-400">
                                Are you sure you want to delete "{deleteDialog.product?.title}"? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setDeleteDialog({ open: false, product: null })}
                                className="border-white/20 text-white hover:bg-white/10"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={deleteProduct}
                                disabled={deleting}
                                className="bg-red-500 hover:bg-red-600 text-white"
                            >
                                {deleting ? 'Deleting...' : 'Delete'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}

export default function AdminProductsPage() {
    return (
        <ProtectedRoute>
            <ProductsContent />
        </ProtectedRoute>
    );
}
