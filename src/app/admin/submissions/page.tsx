'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ArrowLeft, Mail, Phone, Building, Package, Clock, DollarSign,
    CheckCircle, XCircle, AlertCircle, FileSpreadsheet, Pencil, Eye,
    Loader2, X, Image as ImageIcon, Trash2
} from 'lucide-react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription
} from '@/components/ui/sheet';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Loader } from '@/components/common/Loader';
import { supabase } from '@/lib/supabase';
import type { QuoteRequest, QuoteStatus } from '@/types/database';
import { toast } from 'sonner';

const statusConfig: Record<QuoteStatus, { label: string; color: string; dot: string }> = {
    pending: { label: 'Pending', color: 'text-amber-400 border-amber-400/20', dot: 'bg-amber-400' },
    quoted: { label: 'Quoted', color: 'text-blue-400 border-blue-400/20', dot: 'bg-blue-400' },
    accepted: { label: 'Verified', color: 'text-emerald-400 border-emerald-400/20', dot: 'bg-emerald-400' },
    rejected: { label: 'Rejected', color: 'text-red-400 border-red-400/20', dot: 'bg-red-400' },
};

const categoryLabels: Record<string, string> = {
    laptop: 'Laptop',
    desktop: 'Desktop',
    gpu: 'GPU',
    phone: 'Phone',
    other: 'Other Asset',
    monitor: 'Monitor',
    server: 'Server',
    printer: 'Printer',
};

const conditionLabels: Record<string, string> = {
    grade_a: 'Grade A',
    grade_b: 'Grade B',
    refurbished: 'Refurbished',
    parts_only: 'Parts Only',
    functional: 'Fully Functional',
    power_on_no_os: 'Powers On (No OS)',
    damaged_screen: 'Damaged Screen',
};

function SubmissionsContent() {
    const [allQuotes, setAllQuotes] = useState<QuoteRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all');
    const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Editable fields for the detail modal
    const [editData, setEditData] = useState({
        category: '',
        brand_model: '',
        processor: '',
        ram: '',
        storage_type: '',
        condition: '',
        quantity: 1,
        quoted_price: '',
        admin_notes: '',
    });

    const fetchQuotes = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('quote_requests')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAllQuotes(data || []);
        } catch (error) {
            console.error('Error fetching quotes:', error);
            toast.error('Failed to load submissions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuotes();
    }, []);

    // Filter display client-side
    const quotes = statusFilter === 'all'
        ? allQuotes
        : allQuotes.filter(q => q.status === statusFilter);

    const openDetail = (quote: QuoteRequest) => {
        setSelectedQuote(quote);
        setEditData({
            category: quote.category,
            brand_model: quote.brand_model || '',
            processor: quote.processor || '',
            ram: quote.ram || '',
            storage_type: quote.storage_type || '',
            condition: quote.condition,
            quantity: quote.quantity,
            quoted_price: quote.quoted_price?.toString() || '',
            admin_notes: quote.admin_notes || '',
        });
        setDetailOpen(true);
    };

    const saveEdits = async () => {
        if (!selectedQuote) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('quote_requests')
                .update({
                    category: editData.category,
                    brand_model: editData.brand_model || null,
                    processor: editData.processor || null,
                    ram: editData.ram || null,
                    storage_type: editData.storage_type || null,
                    condition: editData.condition,
                    quantity: editData.quantity,
                    quoted_price: editData.quoted_price ? parseFloat(editData.quoted_price) : null,
                    admin_notes: editData.admin_notes || null,
                })
                .eq('id', selectedQuote.id);

            if (error) throw error;
            toast.success('Submission updated');
            fetchQuotes();
        } catch (error) {
            console.error('Error updating:', error);
            toast.error('Failed to update');
        } finally {
            setSaving(false);
        }
    };

    const verifySubmission = async () => {
        if (!selectedQuote) return;
        setSaving(true);
        try {
            // Create verified item FIRST (so if it fails, quote status stays unchanged)
            const { error: insertError } = await supabase.from('verified_items').insert({
                quote_request_id: selectedQuote.id,
                category: editData.category,
                brand: editData.brand_model?.split(' ')[0] || null,
                model: editData.brand_model?.split(' ').slice(1).join(' ') || null,
                processor: editData.processor || null,
                ram: editData.ram || null,
                storage: editData.storage_type || null,
                condition: editData.condition,
                quantity: editData.quantity,
                quoted_price: editData.quoted_price ? parseFloat(editData.quoted_price) : null,
                admin_notes: editData.admin_notes || null,
                images: selectedQuote.image_urls || null,
            });

            if (insertError) {
                console.error('Error inserting verified_item:', insertError.message, insertError.code, insertError.details);
                throw new Error(`Failed to create verified item: ${insertError.message}`);
            }

            // Only update quote status after verified item is saved
            const { error: updateError } = await supabase
                .from('quote_requests')
                .update({
                    status: 'accepted' as QuoteStatus,
                    category: editData.category,
                    brand_model: editData.brand_model || null,
                    processor: editData.processor || null,
                    ram: editData.ram || null,
                    storage_type: editData.storage_type || null,
                    condition: editData.condition,
                    quantity: editData.quantity,
                    quoted_price: editData.quoted_price ? parseFloat(editData.quoted_price) : null,
                    admin_notes: editData.admin_notes || null,
                })
                .eq('id', selectedQuote.id);

            if (updateError) {
                console.error('Error updating quote_request:', updateError.message, updateError.code, updateError.details);
                throw new Error(`Failed to update submission: ${updateError.message}`);
            }

            toast.success('Submission verified and item saved!');
            setDetailOpen(false);
            fetchQuotes();
        } catch (error: any) {
            console.error('Error verifying:', error?.message || error);
            toast.error(error?.message || 'Failed to verify submission');
        } finally {
            setSaving(false);
        }
    };

    const rejectSubmission = async () => {
        if (!selectedQuote) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('quote_requests')
                .update({
                    status: 'rejected' as QuoteStatus,
                    admin_notes: editData.admin_notes || null,
                })
                .eq('id', selectedQuote.id);

            if (error) throw error;
            toast.success('Submission rejected');
            setDetailOpen(false);
            fetchQuotes();
        } catch (error) {
            console.error('Error rejecting:', error);
            toast.error('Failed to reject submission');
        } finally {
            setSaving(false);
        }
    };

    const deleteSubmission = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!confirm('Are you sure you want to delete this submission? This cannot be undone.')) return;

        setSaving(true);
        try {
            // 1. Update local state immediately for a snap response
            setAllQuotes(prev => prev.filter(q => q.id !== id));
            if (detailOpen && selectedQuote?.id === id) setDetailOpen(false);

            // 2. Perform the database deletions
            // Clean up any verified_items first
            await supabase
                .from('verified_items')
                .delete()
                .eq('quote_request_id', id);

            const { data: deletedData, error } = await supabase
                .from('quote_requests')
                .delete()
                .eq('id', id)
                .select();

            if (error) {
                toast.error(`Delete failed: ${error.message}`);
                fetchQuotes();
                throw error;
            }

            if (!deletedData || deletedData.length === 0) {
                toast.error('Could not delete from database. Record may have already been removed or permissions are restricted.');
                fetchQuotes();
                return;
            }

            toast.success('Submission permanently deleted');

            // 3. Use a longer delay before re-fetching to let the DB settle
            setTimeout(() => fetchQuotes(), 3000);
        } catch (error) {
            console.error('Error deleting:', error);
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
        });
    };

    const statusCounts = {
        all: allQuotes.length,
        pending: allQuotes.filter(q => q.status === 'pending').length,
        accepted: allQuotes.filter(q => q.status === 'accepted').length,
        rejected: allQuotes.filter(q => q.status === 'rejected').length,
    };

    return (
        <div className="min-h-screen">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-8 pt-20">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-white tracking-tight">Submissions</h1>
                    <p className="text-slate-500 text-sm mt-1">Review and manage incoming quote requests from users</p>
                </div>

                {/* Status Filter Tabs */}
                <div className="flex gap-1.5 mb-8 flex-wrap">
                    {(['all', 'pending', 'accepted', 'rejected'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border flex items-center gap-2 ${statusFilter === status
                                ? 'bg-emerald-600/15 border-emerald-500/30 text-emerald-400'
                                : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
                                }`}
                        >
                            {status === 'all' ? 'All' : status === 'accepted' ? 'Verified' : status.charAt(0).toUpperCase() + status.slice(1)}
                            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${statusFilter === status ? 'bg-emerald-400/10 text-emerald-400' : 'bg-white/5 text-slate-500'}`}>
                                {status === 'all' ? statusCounts.all : status === 'pending' ? statusCounts.pending : status === 'accepted' ? statusCounts.accepted : statusCounts.rejected}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Submissions List */}
                {loading ? (
                    <Loader message="Loading submissions..." variant="page" />
                ) : quotes.length === 0 ? (
                    <Card className="bg-white/5 border-white/10">
                        <CardContent className="p-12 text-center">
                            <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-white mb-2">No submissions found</h3>
                            <p className="text-slate-400 text-sm">
                                {statusFilter === 'all' ? 'No quote requests have been submitted yet.' : `No ${statusFilter} submissions.`}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.02]">
                        {quotes.map((quote, index) => {
                            const config = statusConfig[quote.status];
                            const initials = quote.contact_name.charAt(0).toUpperCase();

                            return (
                                <div
                                    key={quote.id}
                                    className={`group relative flex items-center justify-between py-4 px-6 cursor-pointer transition-all duration-200 hover:bg-white/[0.04] border-b border-white/10 last:border-0`}
                                    onClick={() => openDetail(quote)}
                                >
                                    {/* Subtle Teal Border on Hover */}
                                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-emerald-500 scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-center" />

                                    <div className="flex items-center gap-6 flex-1 min-w-0">
                                        {/* Avatar Column */}
                                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                            <span className="text-sm font-bold text-emerald-400">{initials}</span>
                                        </div>

                                        {/* Name & Meta Column */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-white text-[15px] truncate">
                                                    {quote.contact_name}
                                                </span>
                                                {quote.company_name && (
                                                    <span className="text-slate-500 text-sm truncate font-medium">
                                                        · {quote.company_name}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2.5">
                                                <span className="px-2 py-0.5 rounded-md bg-emerald-500/5 text-[11px] font-medium text-emerald-400/80 border border-emerald-500/10">
                                                    {categoryLabels[quote.category] || quote.category}
                                                </span>
                                                <span className="text-slate-600 text-[10px]">·</span>
                                                <span className="text-slate-400 text-sm font-medium">Qty: {quote.quantity}</span>
                                                {quote.brand_model && (
                                                    <>
                                                        <span className="text-slate-600 text-[10px]">·</span>
                                                        <span className="text-slate-500 text-sm truncate max-w-[400px]">{quote.brand_model}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Alignment Columns */}
                                    <div className="flex items-center gap-12 shrink-0">
                                        {/* Timestamp Column */}
                                        <span className="text-sm text-slate-500 w-48 text-right hidden lg:block font-medium whitespace-nowrap">
                                            {formatDate(quote.created_at)}
                                        </span>

                                        {/* Status & Action Group - Fixed width for alignment */}
                                        <div className="w-40 flex items-center justify-end gap-3">
                                            <div className="w-28 flex justify-end shrink-0">
                                                <Badge variant="outline" className={`h-7 px-3 text-xs font-semibold border ${config.color} flex items-center gap-2 rounded-full`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                                                    {config.label}
                                                </Badge>
                                            </div>
                                            {quote.status === 'rejected' ? (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    disabled={saving}
                                                    onClick={(e) => deleteSubmission(quote.id, e)}
                                                    className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-full shrink-0"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            ) : (
                                                <div className="w-8 shrink-0" /> // Placeholder to maintain timestamp alignment
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Summary Footer */}
                        <div className="px-6 py-3 bg-white/[0.01] border-t border-white/10 flex items-center justify-between">
                            <span className="text-xs text-slate-500 font-medium tracking-tight">
                                Total: <span className="text-slate-300">{quotes.length}</span> submissions
                            </span>
                            <span className="text-[11px] text-slate-600">
                                Push to sync updated just now
                            </span>
                        </div>
                    </div>
                )}

                {/* Detail / Edit Drawer */}
                <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
                    <SheetContent
                        side="right"
                        className="border-l border-white/10 bg-[#0a0a0a] text-white sm:max-w-[45%] p-0 flex flex-col h-full shadow-2xl"
                        showCloseButton={true}
                    >
                        <SheetHeader className="p-8 pb-4 border-b border-white/5">
                            <SheetTitle className="text-2xl font-bold tracking-tight text-white">Submission Details</SheetTitle>
                            <SheetDescription className="text-slate-500 text-sm">
                                Review and edit this submission. You can verify or reject it.
                            </SheetDescription>
                        </SheetHeader>

                        {selectedQuote && (
                            <>
                                <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 custom-scrollbar">
                                    {/* Contact Info */}
                                    <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 space-y-4">
                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Email</span>
                                                <div className="flex items-center gap-2 text-slate-200 font-medium">
                                                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                                                    <span className="text-sm truncate">{selectedQuote.email}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Company</span>
                                                <div className="flex items-center gap-2 text-slate-200 font-medium">
                                                    <Building className="w-3.5 h-3.5 text-slate-500" />
                                                    <span className="text-sm truncate">{selectedQuote.company_name || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {selectedQuote.phone && (
                                            <div className="space-y-1 pt-2 border-t border-white/5">
                                                <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Phone</span>
                                                <div className="flex items-center gap-2 text-slate-200 font-medium">
                                                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                                                    <span className="text-sm">{selectedQuote.phone}</span>
                                                </div>
                                            </div>
                                        )}
                                        <div className="pt-2 border-t border-white/5">
                                            <p className="text-[11px] text-slate-500 font-medium italic">
                                                Submitted on {formatDate(selectedQuote.created_at)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Editable Product Fields */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <h4 className="text-[11px] font-black tracking-[0.2em] text-emerald-500/80 uppercase">Product Details</h4>
                                            <div className="h-[1px] flex-1 bg-white/5" />
                                            <Pencil className="w-3 h-3 text-emerald-500/50" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Category</Label>
                                                <Select value={editData.category} onValueChange={(v) => setEditData({ ...editData, category: v })}>
                                                    <SelectTrigger className="bg-white/[0.03] border-white/10 text-white text-sm h-11 focus:ring-emerald-500/30 focus:border-emerald-500/30">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-[#121212] border-white/10 text-white">
                                                        <SelectItem value="laptop">Laptop</SelectItem>
                                                        <SelectItem value="desktop">Desktop</SelectItem>
                                                        <SelectItem value="gpu">GPU</SelectItem>
                                                        <SelectItem value="phone">Phone</SelectItem>
                                                        <SelectItem value="other">Other</SelectItem>
                                                        <SelectItem value="monitor">Monitor</SelectItem>
                                                        <SelectItem value="server">Server</SelectItem>
                                                        <SelectItem value="printer">Printer</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Condition</Label>
                                                <Select value={editData.condition} onValueChange={(v) => setEditData({ ...editData, condition: v })}>
                                                    <SelectTrigger className="bg-white/[0.03] border-white/10 text-white text-sm h-11 focus:ring-emerald-500/30 focus:border-emerald-500/30">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-[#121212] border-white/10 text-white">
                                                        <SelectItem value="grade_a">Grade A (Excellent)</SelectItem>
                                                        <SelectItem value="grade_b">Grade B (Minor Wear)</SelectItem>
                                                        <SelectItem value="refurbished">Refurbished</SelectItem>
                                                        <SelectItem value="parts_only">Scrap/Parts Only</SelectItem>
                                                        <SelectItem value="functional">Fully Functional</SelectItem>
                                                        <SelectItem value="power_on_no_os">Powers On (No OS)</SelectItem>
                                                        <SelectItem value="damaged_screen">Damaged Screen</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Brand / Model</Label>
                                            <Input
                                                value={editData.brand_model}
                                                onChange={(e) => setEditData({ ...editData, brand_model: e.target.value })}
                                                placeholder="e.g., Dell Latitude 5520"
                                                className="bg-white/[0.03] border-white/10 text-white text-sm h-11 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500/30"
                                            />
                                        </div>

                                        {/* 3-Column Spec Grid */}
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Processor</Label>
                                                <Input
                                                    value={editData.processor}
                                                    onChange={(e) => setEditData({ ...editData, processor: e.target.value })}
                                                    placeholder="i5-1135G7"
                                                    className="bg-white/[0.03] border-white/10 text-white text-sm h-11 focus-visible:ring-emerald-500/30"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">RAM</Label>
                                                <Input
                                                    value={editData.ram}
                                                    onChange={(e) => setEditData({ ...editData, ram: e.target.value })}
                                                    placeholder="16GB"
                                                    className="bg-white/[0.03] border-white/10 text-white text-sm h-11 focus-visible:ring-emerald-500/30"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Storage</Label>
                                                <Input
                                                    value={editData.storage_type}
                                                    onChange={(e) => setEditData({ ...editData, storage_type: e.target.value })}
                                                    placeholder="512GB SSD"
                                                    className="bg-white/[0.03] border-white/10 text-white text-sm h-11 focus-visible:ring-emerald-500/30"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Quantity</Label>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    value={editData.quantity}
                                                    onChange={(e) => setEditData({ ...editData, quantity: parseInt(e.target.value) || 1 })}
                                                    className="bg-white/[0.03] border-white/10 text-white text-sm h-11 focus-visible:ring-emerald-500/30"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Quoted Price ($)</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={editData.quoted_price}
                                                    onChange={(e) => setEditData({ ...editData, quoted_price: e.target.value })}
                                                    placeholder="Enter price"
                                                    className="bg-white/[0.03] border-white/10 text-white text-sm h-11 focus-visible:ring-emerald-500/30"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Admin Notes</Label>
                                            <Textarea
                                                value={editData.admin_notes}
                                                onChange={(e) => setEditData({ ...editData, admin_notes: e.target.value })}
                                                placeholder="Internal notes about this submission..."
                                                className="bg-white/[0.03] border-white/10 text-white text-sm min-h-[100px] focus-visible:ring-emerald-500/30"
                                            />
                                        </div>
                                    </div>

                                    {/* Attachments */}
                                    {(selectedQuote.image_urls?.length || selectedQuote.spreadsheet_url) && (
                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-[11px] font-black tracking-[0.2em] text-emerald-500/80 uppercase">Attachments</h4>
                                                <div className="h-[1px] flex-1 bg-white/5" />
                                            </div>

                                            {selectedQuote.image_urls && selectedQuote.image_urls.length > 0 && (
                                                <div className="flex flex-wrap gap-3">
                                                    {selectedQuote.image_urls.map((url, i) => (
                                                        <div key={i}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setPreviewImage(url);
                                                            }}
                                                            className="group relative w-24 h-24 rounded-xl overflow-hidden border border-white/10 hover:border-emerald-500/50 transition-all duration-300 cursor-zoom-in"
                                                        >
                                                            <img src={url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                            <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <Eye className="w-5 h-5 text-white" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {selectedQuote.spreadsheet_url && (
                                                <a href={selectedQuote.spreadsheet_url} target="_blank" rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-all">
                                                    <FileSpreadsheet className="w-4 h-4" />
                                                    View Product List Spreadsheet
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <SheetFooter className="p-8 border-t border-white/10 bg-white/[0.01] flex flex-row items-center justify-between sm:justify-between w-full">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={saveEdits}
                                        disabled={saving}
                                        className="text-slate-400 hover:text-white hover:bg-white/5"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Pencil className="w-4 h-4 mr-1" />}
                                        Save Edits
                                    </Button>

                                    <div className="flex items-center gap-3">
                                        {selectedQuote.status === 'pending' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={rejectSubmission}
                                                disabled={saving}
                                                className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
                                            >
                                                <XCircle className="w-4 h-4 mr-2 text-red-500" />
                                                Reject Submission
                                            </Button>
                                        )}

                                        {selectedQuote.status !== 'pending' && (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={async () => {
                                                        await supabase.from('quote_requests').update({ status: 'pending' as QuoteStatus }).eq('id', selectedQuote.id);
                                                        toast.success('Reset to pending');
                                                        setDetailOpen(false);
                                                        fetchQuotes();
                                                    }}
                                                    disabled={saving}
                                                    className="border-white/20 text-slate-300 hover:bg-white/10 px-4"
                                                >
                                                    Reset to Pending
                                                </Button>
                                                {selectedQuote.status === 'rejected' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => deleteSubmission(selectedQuote.id)}
                                                        disabled={saving}
                                                        className="border-red-500/30 text-red-500 hover:bg-red-500/10 hover:border-red-500/50"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Delete Submission
                                                    </Button>
                                                )}
                                            </>
                                        )}

                                        <Button
                                            size="sm"
                                            onClick={verifySubmission}
                                            disabled={saving}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 font-bold shadow-lg shadow-emerald-900/20"
                                        >
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                            {selectedQuote.status === 'accepted' ? 'Re-verify & Update' : 'Verify & List Product'}
                                        </Button>
                                    </div>
                                </SheetFooter>
                            </>
                        )}
                    </SheetContent>
                </Sheet>

                {/* Image Preview Modal */}
                <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
                    <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden bg-black/90 border-white/10 flex items-center justify-center">
                        <DialogHeader className="sr-only">
                            <DialogTitle>Image Preview</DialogTitle>
                        </DialogHeader>
                        <div className="relative w-full h-full flex items-center justify-center p-4">
                            {previewImage && (
                                <img
                                    src={previewImage}
                                    alt="Preview"
                                    className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                                />
                            )}
                            <button
                                onClick={() => setPreviewImage(null)}
                                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 flex items-center justify-center text-white transition-all backdrop-blur-sm"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}

export default function AdminSubmissionsPage() {
    return (
        <ProtectedRoute requireAdmin>
            <SubmissionsContent />
        </ProtectedRoute>
    );
}
