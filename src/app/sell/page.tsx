'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, Image, CheckCircle, AlertCircle, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/lib/supabase';
import { quoteFormSchema, type QuoteFormData } from '@/lib/validations';
import { toast } from 'sonner';

const categories = [
    { value: 'laptop', label: 'Laptop' },
    { value: 'desktop', label: 'Desktop' },
    { value: 'monitor', label: 'Monitor' },
    { value: 'server', label: 'Server' },
    { value: 'printer', label: 'Printer' },
];

const conditions = [
    { value: 'functional', label: 'Fully Functional' },
    { value: 'power_on_no_os', label: 'Powers On (No OS)' },
    { value: 'damaged_screen', label: 'Damaged Screen' },
    { value: 'parts_only', label: 'Scrap/Parts Only' },
];

const ramOptions = ['4GB', '8GB', '16GB', '32GB+'];
const storageOptions = ['HDD', 'SSD'];

function ImageUploader({ onUpload }: { onUpload: (urls: string[]) => void }) {
    const [uploading, setUploading] = useState(false);
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        setUploading(true);
        const urls: string[] = [];

        try {
            for (const file of acceptedFiles) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `quote-images/${fileName}`;

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

            setUploadedImages([...uploadedImages, ...urls]);
            onUpload([...uploadedImages, ...urls]);
            toast.success(`${urls.length} image(s) uploaded successfully`);
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload images');
        } finally {
            setUploading(false);
        }
    }, [uploadedImages, onUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp']
        },
        maxFiles: 5,
    });

    return (
        <div>
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/20 hover:border-white/40'
                    }`}
            >
                <input {...getInputProps()} />
                {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                        <p className="text-slate-400">Uploading...</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <Image className="w-8 h-8 text-slate-400" />
                        <p className="text-slate-300">Drag photos here or click to browse</p>
                        <p className="text-slate-500 text-sm">Up to 5 images (PNG, JPG, WebP)</p>
                    </div>
                )}
            </div>

            {uploadedImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                    {uploadedImages.map((url, index) => (
                        <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden">
                            <img src={url} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-emerald-400" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function SpreadsheetUploader({ onUpload }: { onUpload: (url: string) => void }) {
    const [uploading, setUploading] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<string | null>(null);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setUploading(true);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `spreadsheets/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('uploads')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('uploads')
                .getPublicUrl(filePath);

            setUploadedFile(file.name);
            onUpload(publicUrl);
            toast.success('Spreadsheet uploaded successfully');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload spreadsheet');
        } finally {
            setUploading(false);
        }
    }, [onUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'text/csv': ['.csv'],
        },
        maxFiles: 1,
    });

    return (
        <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/20 hover:border-white/40'
                } ${uploadedFile ? 'border-emerald-500 bg-emerald-500/10' : ''}`}
        >
            <input {...getInputProps()} />
            {uploading ? (
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                    <p className="text-slate-400">Uploading...</p>
                </div>
            ) : uploadedFile ? (
                <div className="flex flex-col items-center gap-2">
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                    <p className="text-emerald-400 font-medium">{uploadedFile}</p>
                    <p className="text-slate-500 text-sm">Click to replace</p>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-2">
                    <FileSpreadsheet className="w-8 h-8 text-slate-400" />
                    <p className="text-slate-300">Drag your inventory spreadsheet here</p>
                    <p className="text-slate-500 text-sm">CSV, XLS, or XLSX</p>
                </div>
            )}
        </div>
    );
}

export default function SellPage() {
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(null);

    const form = useForm<QuoteFormData>({
        resolver: zodResolver(quoteFormSchema),
        defaultValues: {
            company_name: '',
            contact_name: '',
            email: '',
            phone: '',
            category: undefined,
            quantity: 1,
            brand_model: '',
            processor: '',
            ram: '',
            storage_type: '',
            condition: undefined,
        },
    });

    const onSubmit = async (data: QuoteFormData) => {
        setSubmitting(true);

        try {
            const response = await fetch('/api/quotes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    company_name: data.company_name || null,
                    contact_name: data.contact_name,
                    email: data.email,
                    phone: data.phone || null,
                    category: data.category,
                    quantity: data.quantity,
                    brand_model: data.brand_model || null,
                    processor: data.processor || null,
                    ram: data.ram || null,
                    storage_type: data.storage_type || null,
                    condition: data.condition,
                    spreadsheet_url: spreadsheetUrl,
                    image_urls: imageUrls,
                }),
            });

            const contentType = response.headers.get('content-type');
            let result: any = {};

            if (contentType && contentType.includes('application/json')) {
                result = await response.json();
            } else {
                const text = await response.text();
                result = { error: `Server error (${response.status})`, details: text.slice(0, 200) };
            }

            if (!response.ok) {
                const errorMsg = result?.details || result?.error || `Request failed with status ${response.status}`;
                console.error('API Error:', errorMsg);
                throw new Error(errorMsg);
            }

            setSubmitted(true);
            toast.success('Quote request submitted successfully!');
        } catch (error: any) {
            console.error('Submission error:', error?.message || error);
            toast.error(error?.message || 'Failed to submit quote request. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-8">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4">Quote Request Submitted!</h2>
                    <p className="text-slate-400 mb-8">
                        Thank you for your submission. We'll review your items and get back to you with a guaranteed quote within 24-48 hours.
                    </p>
                    <Button
                        onClick={() => {
                            setSubmitted(false);
                            form.reset();
                            setImageUrls([]);
                            setSpreadsheetUrl(null);
                        }}
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
                    >
                        Submit Another Quote
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-950 pt-14">
            {/* Hero */}
            <section className="pt-12 pb-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <p className="text-xs uppercase tracking-widest text-emerald-400 mb-3">
                        Sell To Us
                    </p>
                    <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-white tracking-tight">
                        Get a Quote for Your IT Assets
                    </h1>
                    <p className="text-base text-neutral-400 max-w-xl">
                        Fill out the form below and we&apos;ll get back to you within 24-48 hours.
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs text-emerald-400">Certified data destruction included at no additional cost</span>
                    </div>
                </div>
            </section>

            {/* Form Section */}
            <section className="py-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            {/* Contact Information */}
                            <Card className="rounded-xl border border-neutral-800 bg-neutral-900/50">
                                <CardHeader>
                                    <CardTitle className="text-white">Contact Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="company_name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-slate-300">Company Name (Optional)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            placeholder="Your company"
                                                            className="bg-neutral-900/50 border-neutral-800 text-white placeholder:text-neutral-500"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="contact_name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-slate-300">Contact Name *</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            placeholder="Your name"
                                                            className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-slate-300">Email Address *</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            type="email"
                                                            placeholder="you@company.com"
                                                            className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="phone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-slate-300">Phone (Optional)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            type="tel"
                                                            placeholder="(123) 456-7890"
                                                            className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Item Details */}
                            <Card className="bg-white/5 border-white/10">
                                <CardHeader>
                                    <CardTitle className="text-white">Item Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="category"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-slate-300">Item Category *</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                                                <SelectValue placeholder="Select category" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {categories.map((cat) => (
                                                                <SelectItem key={cat.value} value={cat.value}>
                                                                    {cat.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="quantity"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-slate-300">Quantity *</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            type="number"
                                                            min={1}
                                                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                                                            className="bg-white/5 border-white/10 text-white"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="brand_model"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-slate-300">Brand / Model</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="e.g., Dell Latitude 5420"
                                                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="processor"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-slate-300">Processor (CPU)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            placeholder="e.g., Intel i5 10th Gen"
                                                            className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="ram"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-slate-300">Memory (RAM)</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value || ''}>
                                                        <FormControl>
                                                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                                                <SelectValue placeholder="Select RAM" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {ramOptions.map((ram) => (
                                                                <SelectItem key={ram} value={ram}>
                                                                    {ram}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="storage_type"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-slate-300">Storage Type</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value || ''}>
                                                        <FormControl>
                                                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                                                <SelectValue placeholder="Select type" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {storageOptions.map((type) => (
                                                                <SelectItem key={type} value={type}>
                                                                    {type}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="condition"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-slate-300">Condition *</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                                            <SelectValue placeholder="Select condition" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {conditions.map((cond) => (
                                                            <SelectItem key={cond.value} value={cond.value}>
                                                                {cond.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            {/* Photo Upload */}
                            <Card className="bg-white/5 border-white/10">
                                <CardHeader>
                                    <CardTitle className="text-white">Photos (Optional)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ImageUploader onUpload={setImageUrls} />
                                </CardContent>
                            </Card>

                            {/* Bulk Upload */}
                            <Card className="bg-white/5 border-white/10">
                                <CardHeader>
                                    <CardTitle className="text-white">Bulk Inventory Upload</CardTitle>
                                    <p className="text-slate-400 text-sm mt-1">
                                        Have hundreds of items? Upload a spreadsheet instead.
                                    </p>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
                                        <a href="/inventory-template.csv" download>
                                            <Download className="mr-2 w-4 h-4" />
                                            Download CSV Template
                                        </a>
                                    </Button>
                                    <SpreadsheetUploader onUpload={setSpreadsheetUrl} />
                                </CardContent>
                            </Card>

                            {/* Submit */}
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-6 text-lg"
                            >
                                {submitting ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Submitting...
                                    </div>
                                ) : (
                                    'Submit Quote Request'
                                )}
                            </Button>

                            <p className="text-center text-slate-500 text-sm">
                                By submitting, you agree to our Terms of Service and Privacy Policy.
                            </p>
                        </form>
                    </Form>
                </div>
            </section>
        </div>
    );
}
