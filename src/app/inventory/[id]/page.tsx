'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, CheckCircle, Laptop, Monitor, Server, Printer, HardDrive, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabase';
import type { Product, ConditionGrade } from '@/types/database';
import { Loader } from '@/components/common/Loader';

const conditionLabels: Record<ConditionGrade, { label: string; description: string; color: string }> = {
    A: {
        label: 'Grade A - Like New',
        description: 'Excellent condition with minimal to no signs of use. Fully tested and functional.',
        color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    },
    B: {
        label: 'Grade B - Good',
        description: 'Minor cosmetic wear (light scratches, scuffs). Fully functional with all features working.',
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    },
    refurbished: {
        label: 'Refurbished',
        description: 'Repaired in-house with replacement parts (e.g., new SSD, RAM, or battery). Like-new performance.',
        color: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    },
    parts: {
        label: 'Parts/Scrap Only',
        description: 'For hobbyists or recyclers looking for specific components. May not power on.',
        color: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    },
};

const categoryIcons: Record<string, any> = {
    laptop: Laptop,
    desktop: HardDrive,
    monitor: Monitor,
    server: Server,
    printer: Printer,
};

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [product, setProduct] = useState<Product | null>(null);
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
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Product Not Found</h2>
                    <p className="text-slate-400 mb-6">The product you're looking for doesn't exist.</p>
                    <Link href="/inventory">
                        <Button>Back to Inventory</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const condition = conditionLabels[product.condition];
    const CategoryIcon = categoryIcons[product.category?.slug || 'laptop'] || Package;

    return (
        <div className="min-h-screen bg-slate-900 pt-8 pb-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Button */}
                <Link href="/inventory" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Inventory
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Image Gallery */}
                    <div>
                        <div className="aspect-square bg-slate-800 rounded-2xl overflow-hidden mb-4">
                            {product.images && product.images[selectedImage] ? (
                                <img
                                    src={product.images[selectedImage]}
                                    alt={product.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <CategoryIcon className="w-32 h-32 text-slate-600" />
                                </div>
                            )}
                        </div>

                        {/* Thumbnail Row */}
                        {product.images && product.images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {product.images.map((image, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedImage(index)}
                                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${selectedImage === index ? 'border-emerald-500' : 'border-transparent'
                                            }`}
                                    >
                                        <img src={image} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div>
                        {/* Badges */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            <Badge variant="outline" className={`${condition.color} border text-sm py-1`}>
                                {condition.label}
                            </Badge>
                            {product.is_bulk_lot && (
                                <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-sm py-1">
                                    Bulk Lot {product.lot_number && `#${product.lot_number}`}
                                </Badge>
                            )}
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                            {product.title}
                        </h1>
                        <p className="text-slate-400 text-lg mb-6">
                            {product.brand} {product.model}
                        </p>

                        {/* Price */}
                        <div className="mb-8">
                            {product.price ? (
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold text-emerald-400">${product.price.toFixed(2)}</span>
                                    {product.is_bulk_lot && <span className="text-slate-400">per unit</span>}
                                </div>
                            ) : (
                                <span className="text-xl text-slate-400">Contact for pricing</span>
                            )}
                            <p className="text-slate-400 mt-1">
                                {product.quantity} {product.quantity === 1 ? 'unit' : 'units'} available
                            </p>
                        </div>

                        {/* Condition Info */}
                        <Card className="bg-white/5 border-white/10 mb-6">
                            <CardContent className="p-4">
                                <h3 className="text-white font-semibold mb-2">Condition Details</h3>
                                <p className="text-slate-400 text-sm">{condition.description}</p>
                            </CardContent>
                        </Card>

                        {/* Specifications */}
                        <Card className="bg-white/5 border-white/10 mb-6">
                            <CardHeader>
                                <CardTitle className="text-white text-lg">Specifications</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="space-y-3">
                                    {product.processor && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Processor</span>
                                            <span className="text-white">{product.processor}</span>
                                        </div>
                                    )}
                                    {product.ram && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Memory (RAM)</span>
                                            <span className="text-white">{product.ram}</span>
                                        </div>
                                    )}
                                    {product.storage && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Storage</span>
                                            <span className="text-white">{product.storage}</span>
                                        </div>
                                    )}
                                    {product.category && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Category</span>
                                            <span className="text-white">{product.category.name}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Description */}
                        {product.description && (
                            <div className="mb-8">
                                <h3 className="text-white font-semibold mb-2">Description</h3>
                                <p className="text-slate-400">{product.description}</p>
                            </div>
                        )}

                        {/* Trust Info */}
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-8">
                            <h3 className="text-emerald-400 font-semibold mb-2 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" />
                                Quality Guaranteed
                            </h3>
                            <p className="text-slate-300 text-sm">
                                This item has undergone a 20-point diagnostic check and 3-pass NIST 800-88 data sanitization.
                                We don't just sell used tech; we sell renewed reliability.
                            </p>
                        </div>

                        {/* Contact CTA */}
                        <div className="space-y-3">
                            <Button className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-6 text-lg">
                                <Mail className="mr-2 w-5 h-5" />
                                Inquire About This Item
                            </Button>
                            <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 py-6">
                                <Phone className="mr-2 w-5 h-5" />
                                Call (123) 456-7890
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
