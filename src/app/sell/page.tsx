'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, Image, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
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
    { value: 'gpu', label: 'GPU' },
    { value: 'phone', label: 'Phone' },
    { value: 'other', label: 'Other' },
];

const conditions = [
    { value: 'grade_a', label: 'Grade A (Excellent)' },
    { value: 'grade_b', label: 'Grade B (Minor Wear)' },
    { value: 'refurbished', label: 'Refurbished' },
    { value: 'parts_only', label: 'Scrap / Parts Only' },
];

const ramOptions = ['4GB', '8GB', '16GB', '32GB+'];
const storageOptions = ['HDD', 'SSD'];
const vramOptions = ['4GB', '6GB', '8GB', '12GB', '16GB', '24GB+'];

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
    const [step, setStep] = useState(1);
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
            vram: '',
            condition: undefined,
            comments: '',
        },
    });

    const selectedCategory = form.watch('category');

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
                    vram: data.vram || null,
                    condition: data.condition,
                    comments: data.comments || null,
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

    const nextStep = async (fields: (keyof QuoteFormData)[]) => {
        const isValid = await form.trigger(fields);
        if (isValid) setStep(step + 1);
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center">
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
        <div className="min-h-screen pt-14 pb-20">
            {/* Progress Bar */}
            <div className="fixed top-20 left-0 right-0 z-50 px-12 max-w-4xl mx-auto hidden md:block">
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: "25%" }}
                        animate={{ width: `${(step / 3) * 100}%` }}
                        className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                    />
                </div>
                <div className="flex justify-between mt-2">
                    {["Contact", "Assets", "Media"].map((label, i) => (
                        <span key={label} className={`text-[10px] font-black uppercase tracking-widest ${step >= i + 1 ? 'text-emerald-400' : 'text-neutral-600'}`}>
                            {label}
                        </span>
                    ))}
                </div>
            </div>

            {/* Hero */}
            <section className="pt-20 pb-12">
                <div className="container mx-auto px-6 max-w-4xl">
                    <p className="text-[10px] uppercase tracking-[0.4em] text-emerald-500 font-black mb-4">
                        Asset Liquidation
                    </p>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">
                        Turn Liability into Capital.
                    </h1>
                    <p className="text-lg text-neutral-400 max-w-xl leading-relaxed mb-8">
                        Our high-speed audit process guarantees a NIST-compliant quote within 24 hours.
                    </p>
                </div>
            </section>

            {/* Form Section */}
            <section className="mx-auto px-6 max-w-4xl">
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit, (errors) => {
                            console.error('Validation Errors:', errors);
                            toast.error('Please complete all required fields.');
                        })}
                        className="space-y-6"
                    >
                        {step === 1 && (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-6"
                            >
                                <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 relative overflow-hidden noise-overlay">
                                    <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs text-emerald-500">1</div>
                                        Contractor Details
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="company_name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] uppercase tracking-widest font-black text-neutral-500">Company Name</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="P&N Electronics" className="bg-white/5 border-white/5 h-12 focus:border-emerald-500/50 transition-all" />
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
                                                    <FormLabel className="text-[10px] uppercase tracking-widest font-black text-neutral-500">Name *</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="John Doe" className="bg-white/5 border-white/5 h-12" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] uppercase tracking-widest font-black text-neutral-500">Email *</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} type="email" placeholder="john@gmail.com" className="bg-white/5 border-white/5 h-12" />
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
                                                    <FormLabel className="text-[10px] uppercase tracking-widest font-black text-neutral-500">Phone Number *</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} type="tel" placeholder="+1 (555)-000-0000" className="bg-white/5 border-white/5 h-12" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={() => nextStep(['contact_name', 'email'])}
                                        className="w-full mt-10 h-14 bg-white text-black font-black uppercase tracking-widest hover:bg-neutral-200 transition-all"
                                    >
                                        Initialize Quote
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-6"
                            >
                                <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 noise-overlay">
                                    <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs text-emerald-500">2</div>
                                        Hardware Protocol
                                    </h2>
                                    <div className="mb-6 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                                                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                                            </div>
                                            <div>
                                                <p className="text-emerald-400 text-xs font-bold">Bulk Inventory? Skip manual entry.</p>
                                                <p className="text-slate-400 text-[10px]">Upload your spreadsheet in the final step instead.</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                form.setValue('category', 'other');
                                                form.setValue('quantity', 1);
                                                form.setValue('condition', 'grade_b');
                                                form.setValue('comments', 'Bulk submission via spreadsheet manifest.');
                                                setStep(3);
                                            }}
                                            className="text-[10px] uppercase tracking-widest font-black text-emerald-500 hover:text-emerald-500/80 transition-colors whitespace-nowrap"
                                        >
                                            Skip Now →
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <FormField
                                            control={form.control}
                                            name="category"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] uppercase tracking-widest font-black text-neutral-500">Asset Category *</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="bg-white/5 border-white/5 h-12">
                                                                <SelectValue placeholder="Select type" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {categories.map((cat) => (
                                                                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
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
                                                    <FormLabel className="text-[10px] uppercase tracking-widest font-black text-neutral-500">Volume (Units) *</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} type="number" min={1} className="bg-white/5 border-white/5 h-12" onChange={(e) => field.onChange(parseInt(e.target.value))} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="space-y-6">
                                        <FormField
                                            control={form.control}
                                            name="brand_model"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] uppercase tracking-widest font-black text-neutral-500">
                                                        {selectedCategory === 'gpu' ? 'Chipset & Model' :
                                                            selectedCategory === 'phone' ? 'Phone Model & Color' :
                                                                'Model Identification'}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input {...field}
                                                            placeholder={selectedCategory === 'gpu' ? 'e.g. RTX 4090 Rog Strix' :
                                                                selectedCategory === 'phone' ? 'e.g. iPhone 15 Pro Titanium' :
                                                                    'e.g. MacBook Pro 14-inch M3 Max'}
                                                            className="bg-white/5 border-white/5 h-12" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {selectedCategory !== 'other' && (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <FormField
                                                    control={form.control}
                                                    name="processor"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-[10px] uppercase tracking-widest font-black text-neutral-500">
                                                                {selectedCategory === 'gpu' ? 'Chipset' :
                                                                    selectedCategory === 'phone' ? 'Battery Health %' :
                                                                        'Processor'}
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input {...field}
                                                                    placeholder={selectedCategory === 'gpu' ? 'AD102' :
                                                                        selectedCategory === 'phone' ? '98%' :
                                                                            'i7-13700H'}
                                                                    className="bg-white/5 border-white/5 h-12" />
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
                                                            <FormLabel className="text-[10px] uppercase tracking-widest font-black text-neutral-500">
                                                                {selectedCategory === 'gpu' ? 'VRAM' :
                                                                    selectedCategory === 'phone' ? 'Locked or Unlocked?' :
                                                                        'RAM'}
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input {...field}
                                                                    placeholder={selectedCategory === 'gpu' ? '24GB GDDR6X' :
                                                                        selectedCategory === 'phone' ? 'e.g. Unlocked' :
                                                                            '32GB'}
                                                                    className="bg-white/5 border-white/5 h-12" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="storage_type"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-[10px] uppercase tracking-widest font-black text-neutral-500">
                                                                {selectedCategory === 'gpu' ? 'Series' :
                                                                    'Storage'}
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input {...field}
                                                                    placeholder={selectedCategory === 'gpu' ? 'RTX 40-Series' :
                                                                        '1TB SSD'}
                                                                    className="bg-white/5 border-white/5 h-12" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        )}

                                        <FormField
                                            control={form.control}
                                            name="condition"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] uppercase tracking-widest font-black text-neutral-500">Asset Condition *</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="bg-white/5 border-white/5 h-12">
                                                                <SelectValue placeholder="Current condition" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {conditions.map((cond) => (
                                                                <SelectItem key={cond.value} value={cond.value}>{cond.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="comments"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] uppercase tracking-widest font-black text-neutral-500">Additional Schematics</FormLabel>
                                                    <FormControl>
                                                        <Textarea {...field} placeholder="Cosmetic grade, accessories, packaging state..." className="bg-white/5 border-white/5 min-h-[100px]" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="flex gap-4 mt-10">
                                        <Button type="button" onClick={() => setStep(1)} variant="outline" className="h-14 border-white/10 text-white hover:bg-white/5 px-8">Back</Button>
                                        <Button
                                            type="button"
                                            onClick={() => nextStep(['category', 'quantity', 'condition'])}
                                            className="flex-1 h-14 bg-white text-black font-black uppercase tracking-widest hover:bg-neutral-200"
                                        >
                                            Final Verification
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-6"
                            >
                                <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 noise-overlay">
                                    <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs text-emerald-500">3</div>
                                        Audit Verification
                                    </h2>

                                    <div className="space-y-8">
                                        <div className="group relative">
                                            <Label className="text-[10px] uppercase tracking-widest font-black text-neutral-500 mb-2 block">Spreadsheet</Label>
                                            <SpreadsheetUploader onUpload={setSpreadsheetUrl} />
                                        </div>

                                        <div className="group relative">
                                            <Label className="text-[10px] uppercase tracking-widest font-black text-neutral-500 mb-2 block">Visual Documentation (Optional)</Label>
                                            <ImageUploader onUpload={setImageUrls} />
                                        </div>
                                    </div>

                                    <div className="flex gap-4 mt-10">
                                        <Button type="button" onClick={() => setStep(2)} variant="outline" className="h-14 border-white/10 text-white hover:bg-white/5 px-8">Back</Button>
                                        <Button
                                            type="submit"
                                            disabled={submitting}
                                            className="flex-1 h-14 bg-emerald-500 text-black font-black uppercase tracking-widest hover:bg-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)] disabled:opacity-50"
                                        >
                                            {submitting ? 'Authenticating...' : 'Authorize Quote Generation'}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </form>
                </Form>
            </section>
        </div>
    );
}
