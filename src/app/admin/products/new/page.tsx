'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDropzone } from 'react-dropzone';
import { ArrowLeft, Image, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { supabase } from '@/lib/supabase';
import type { Category, ConditionGrade } from '@/types/database';
import { toast } from 'sonner';

const conditionOptions: { value: ConditionGrade; label: string }[] = [
    { value: 'A', label: 'Grade A - Like New' },
    { value: 'B', label: 'Grade B - Good' },
    { value: 'refurbished', label: 'Refurbished' },
    { value: 'parts', label: 'Parts Only' },
];

function NewProductContent() {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
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

    useEffect(() => {
        async function fetchCategories() {
            const { data } = await supabase.from('categories').select('*').order('name');
            if (data) setCategories(data);
        }
        fetchCategories();
    }, []);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        setUploadingImages(true);
        const urls: string[] = [];

        try {
            for (const file of acceptedFiles) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `products/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('uploads')
                    .upload(filePath, file);

                if (uploadError) {
                    console.error('Upload error:', uploadError);
                    continue;
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('uploads')
                    .getPublicUrl(filePath);

                urls.push(publicUrl);
            }

            setImages([...images, ...urls]);
            toast.success(`${urls.length} image(s) uploaded`);
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload images');
        } finally {
            setUploadingImages(false);
        }
    }, [images]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
        maxFiles: 10,
    });

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.condition) {
            toast.error('Please fill in required fields');
            return;
        }

        setLoading(true);

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

            toast.success('Product created successfully');
            router.push('/admin/products');
        } catch (error) {
            console.error('Error creating product:', error);
            toast.error('Failed to create product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/admin/products" className="text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Add New Product</h1>
                        <p className="text-slate-400">Create a new inventory listing</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-white">Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-slate-300">Title *</Label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Dell Latitude 5520 - Intel i5"
                                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                                    required
                                />
                            </div>

                            <div>
                                <Label className="text-slate-300">Description</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Detailed description of the product..."
                                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 min-h-[100px]"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-slate-300">Category</Label>
                                    <Select
                                        value={formData.category_id}
                                        onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                                    >
                                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((cat) => (
                                                <SelectItem key={cat.id} value={cat.id}>
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-slate-300">Condition *</Label>
                                    <Select
                                        value={formData.condition}
                                        onValueChange={(value) => setFormData({ ...formData, condition: value as ConditionGrade })}
                                    >
                                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                            <SelectValue placeholder="Select condition" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {conditionOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Specifications */}
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-white">Specifications</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-slate-300">Brand</Label>
                                    <Input
                                        value={formData.brand}
                                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                        placeholder="e.g., Dell"
                                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                                    />
                                </div>
                                <div>
                                    <Label className="text-slate-300">Model</Label>
                                    <Input
                                        value={formData.model}
                                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                        placeholder="e.g., Latitude 5520"
                                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label className="text-slate-300">Processor</Label>
                                    <Input
                                        value={formData.processor}
                                        onChange={(e) => setFormData({ ...formData, processor: e.target.value })}
                                        placeholder="e.g., Intel i5 11th Gen"
                                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                                    />
                                </div>
                                <div>
                                    <Label className="text-slate-300">RAM</Label>
                                    <Input
                                        value={formData.ram}
                                        onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                                        placeholder="e.g., 16GB DDR4"
                                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                                    />
                                </div>
                                <div>
                                    <Label className="text-slate-300">Storage</Label>
                                    <Input
                                        value={formData.storage}
                                        onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                                        placeholder="e.g., 256GB SSD"
                                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pricing */}
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-white">Pricing & Inventory</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label className="text-slate-300">Price ($)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        placeholder="Leave blank for 'Contact'"
                                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                                    />
                                </div>
                                <div>
                                    <Label className="text-slate-300">Quantity</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                                        className="bg-white/5 border-white/10 text-white"
                                    />
                                </div>
                                <div>
                                    <Label className="text-slate-300">Lot Number (if bulk)</Label>
                                    <Input
                                        value={formData.lot_number}
                                        onChange={(e) => setFormData({ ...formData, lot_number: e.target.value })}
                                        placeholder="e.g., LOT-402"
                                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_bulk_lot"
                                    checked={formData.is_bulk_lot}
                                    onChange={(e) => setFormData({ ...formData, is_bulk_lot: e.target.checked })}
                                    className="rounded border-white/20 bg-white/5"
                                />
                                <Label htmlFor="is_bulk_lot" className="text-slate-300 cursor-pointer">
                                    This is a bulk lot (for resellers/schools)
                                </Label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Images */}
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-white">Product Images</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/20 hover:border-white/40'
                                    }`}
                            >
                                <input {...getInputProps()} />
                                {uploadingImages ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                                        <p className="text-slate-400">Uploading...</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <Image className="w-8 h-8 text-slate-400" />
                                        <p className="text-slate-300">Drag images here or click to browse</p>
                                        <p className="text-slate-500 text-sm">PNG, JPG, WebP (max 10)</p>
                                    </div>
                                )}
                            </div>

                            {images.length > 0 && (
                                <div className="flex flex-wrap gap-3 mt-4">
                                    {images.map((url, index) => (
                                        <div key={index} className="relative group">
                                            <div className="w-24 h-24 rounded-lg overflow-hidden">
                                                <img src={url} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-4 h-4 text-white" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Submit */}
                    <div className="flex gap-4">
                        <Link href="/admin/products" className="flex-1">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full border-white/20 text-white hover:bg-white/10"
                            >
                                Cancel
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creating...
                                </div>
                            ) : (
                                'Create Product'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function NewProductPage() {
    return (
        <ProtectedRoute>
            <NewProductContent />
        </ProtectedRoute>
    );
}
