'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ArrowLeft, Mail, Phone, Building, Package, Clock, DollarSign,
    CheckCircle, XCircle, AlertCircle, FileSpreadsheet, Pencil, Eye,
    Loader2, X, Image as ImageIcon
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
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Loader } from '@/components/common/Loader';
import { supabase } from '@/lib/supabase';
import type { QuoteRequest, QuoteStatus } from '@/types/database';
import { toast } from 'sonner';

const statusConfig: Record<QuoteStatus, { label: string; color: string; icon: any }> = {
    pending: { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
    quoted: { label: 'Quoted', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: DollarSign },
    accepted: { label: 'Verified', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle },
    rejected: { label: 'Rejected', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
};

const categoryLabels: Record<string, string> = {
    laptop: 'Laptop', desktop: 'Desktop', monitor: 'Monitor', server: 'Server', printer: 'Printer',
};

const conditionLabels: Record<string, string> = {
    functional: 'Fully Functional',
    power_on_no_os: 'Powers On (No OS)',
    damaged_screen: 'Damaged Screen',
    parts_only: 'Scrap/Parts Only',
};

function SubmissionsContent() {
    const [allQuotes, setAllQuotes] = useState<QuoteRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all');
    const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [saving, setSaving] = useState(false);

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
        <div className="min-h-screen bg-slate-950">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/admin" className="text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Submissions</h1>
                        <p className="text-slate-400">Review and manage incoming quote requests from users</p>
                    </div>
                </div>

                {/* Status Filter Tabs */}
                <div className="flex gap-2 mb-6 flex-wrap">
                    {(['all', 'pending', 'accepted', 'rejected'] as const).map((status) => (
                        <Button
                            key={status}
                            variant={statusFilter === status ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter(status)}
                            className={statusFilter === status
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'border-white/20 text-slate-300 hover:bg-white/10'}
                        >
                            {status === 'all' ? 'All' : status === 'accepted' ? 'Verified' : status.charAt(0).toUpperCase() + status.slice(1)}
                            <span className="ml-1.5 text-xs opacity-70">
                                ({status === 'all' ? statusCounts.all : status === 'pending' ? statusCounts.pending : status === 'accepted' ? statusCounts.accepted : statusCounts.rejected})
                            </span>
                        </Button>
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
                    <div className="space-y-3">
                        {quotes.map((quote) => {
                            const config = statusConfig[quote.status];
                            const StatusIcon = config.icon;
                            return (
                                <Card
                                    key={quote.id}
                                    className="bg-white/5 border-white/10 hover:bg-white/[0.07] transition-colors cursor-pointer"
                                    onClick={() => openDetail(quote)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className="hidden sm:flex w-10 h-10 rounded-lg bg-white/5 items-center justify-center shrink-0">
                                                    <Package className="w-5 h-5 text-slate-400" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="font-semibold text-white text-sm truncate">
                                                            {quote.contact_name}
                                                        </span>
                                                        {quote.company_name && (
                                                            <span className="text-slate-500 text-xs truncate hidden sm:inline">
                                                                · {quote.company_name}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-slate-400">
                                                        <span>{categoryLabels[quote.category] || quote.category}</span>
                                                        <span>·</span>
                                                        <span>Qty: {quote.quantity}</span>
                                                        {quote.brand_model && (
                                                            <>
                                                                <span className="hidden sm:inline">·</span>
                                                                <span className="hidden sm:inline truncate">{quote.brand_model}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <span className="text-xs text-slate-500 hidden sm:inline">
                                                    {formatDate(quote.created_at)}
                                                </span>
                                                <Badge variant="outline" className={`${config.color} border text-xs`}>
                                                    <StatusIcon className="w-3 h-3 mr-1" />
                                                    {config.label}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Detail / Edit Dialog */}
                <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                    <DialogContent className="bg-slate-900 border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-xl">Submission Details</DialogTitle>
                            <DialogDescription className="text-slate-400">
                                Review and edit this submission. You can verify or reject it.
                            </DialogDescription>
                        </DialogHeader>

                        {selectedQuote && (
                            <div className="space-y-6 mt-2">
                                {/* Contact Info (read-only) */}
                                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                                    <h4 className="text-sm font-medium text-slate-300 mb-3">Contact Information</h4>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-3.5 h-3.5 text-slate-500" />
                                            <span className="text-slate-300">{selectedQuote.email}</span>
                                        </div>
                                        {selectedQuote.phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-3.5 h-3.5 text-slate-500" />
                                                <span className="text-slate-300">{selectedQuote.phone}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <Building className="w-3.5 h-3.5 text-slate-500" />
                                            <span className="text-slate-300">{selectedQuote.company_name || 'N/A'}</span>
                                        </div>
                                        <div className="text-slate-500 text-xs">
                                            Submitted {formatDate(selectedQuote.created_at)}
                                        </div>
                                    </div>
                                </div>

                                {/* Editable Product Fields */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium text-slate-300">Product Details (editable)</h4>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-slate-400 text-xs">Category</Label>
                                            <Select value={editData.category} onValueChange={(v) => setEditData({ ...editData, category: v })}>
                                                <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="laptop">Laptop</SelectItem>
                                                    <SelectItem value="desktop">Desktop</SelectItem>
                                                    <SelectItem value="monitor">Monitor</SelectItem>
                                                    <SelectItem value="server">Server</SelectItem>
                                                    <SelectItem value="printer">Printer</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label className="text-slate-400 text-xs">Condition</Label>
                                            <Select value={editData.condition} onValueChange={(v) => setEditData({ ...editData, condition: v })}>
                                                <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="functional">Fully Functional</SelectItem>
                                                    <SelectItem value="power_on_no_os">Powers On (No OS)</SelectItem>
                                                    <SelectItem value="damaged_screen">Damaged Screen</SelectItem>
                                                    <SelectItem value="parts_only">Scrap/Parts Only</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-slate-400 text-xs">Brand / Model</Label>
                                        <Input
                                            value={editData.brand_model}
                                            onChange={(e) => setEditData({ ...editData, brand_model: e.target.value })}
                                            placeholder="e.g., Dell Latitude 5520"
                                            className="bg-white/5 border-white/10 text-white text-sm"
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <Label className="text-slate-400 text-xs">Processor</Label>
                                            <Input
                                                value={editData.processor}
                                                onChange={(e) => setEditData({ ...editData, processor: e.target.value })}
                                                placeholder="e.g., Intel i5"
                                                className="bg-white/5 border-white/10 text-white text-sm"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-slate-400 text-xs">RAM</Label>
                                            <Input
                                                value={editData.ram}
                                                onChange={(e) => setEditData({ ...editData, ram: e.target.value })}
                                                placeholder="e.g., 16GB"
                                                className="bg-white/5 border-white/10 text-white text-sm"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-slate-400 text-xs">Storage</Label>
                                            <Input
                                                value={editData.storage_type}
                                                onChange={(e) => setEditData({ ...editData, storage_type: e.target.value })}
                                                placeholder="e.g., 256GB SSD"
                                                className="bg-white/5 border-white/10 text-white text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-slate-400 text-xs">Quantity</Label>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={editData.quantity}
                                                onChange={(e) => setEditData({ ...editData, quantity: parseInt(e.target.value) || 1 })}
                                                className="bg-white/5 border-white/10 text-white text-sm"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-slate-400 text-xs">Quoted Price ($)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={editData.quoted_price}
                                                onChange={(e) => setEditData({ ...editData, quoted_price: e.target.value })}
                                                placeholder="Enter price"
                                                className="bg-white/5 border-white/10 text-white text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-slate-400 text-xs">Admin Notes</Label>
                                        <Textarea
                                            value={editData.admin_notes}
                                            onChange={(e) => setEditData({ ...editData, admin_notes: e.target.value })}
                                            placeholder="Internal notes about this submission..."
                                            className="bg-white/5 border-white/10 text-white text-sm min-h-[80px]"
                                        />
                                    </div>
                                </div>

                                {/* Attachments */}
                                {(selectedQuote.image_urls?.length || selectedQuote.spreadsheet_url) && (
                                    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                                        <h4 className="text-sm font-medium text-slate-300 mb-3">Attachments</h4>
                                        {selectedQuote.image_urls && selectedQuote.image_urls.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {selectedQuote.image_urls.map((url, i) => (
                                                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                                        className="w-16 h-16 rounded-lg overflow-hidden border border-white/10 hover:border-emerald-500/50 transition-colors">
                                                        <img src={url} alt="" className="w-full h-full object-cover" />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                        {selectedQuote.spreadsheet_url && (
                                            <a href={selectedQuote.spreadsheet_url} target="_blank" rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300">
                                                <FileSpreadsheet className="w-4 h-4" />
                                                View Spreadsheet
                                            </a>
                                        )}
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <DialogFooter className="flex gap-2 sm:gap-2">
                                    {selectedQuote.status === 'pending' && (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={saveEdits}
                                                disabled={saving}
                                                className="border-white/20 text-white hover:bg-white/10"
                                            >
                                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Pencil className="w-4 h-4 mr-1" />}
                                                Save Edits
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={rejectSubmission}
                                                disabled={saving}
                                                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                            >
                                                <XCircle className="w-4 h-4 mr-1" />
                                                Reject
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={verifySubmission}
                                                disabled={saving}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                            >
                                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                                                Verify & Save
                                            </Button>
                                        </>
                                    )}
                                    {selectedQuote.status !== 'pending' && (
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className={`${statusConfig[selectedQuote.status].color} border`}>
                                                {statusConfig[selectedQuote.status].label}
                                            </Badge>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={verifySubmission}
                                                disabled={saving}
                                                className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                            >
                                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                                                Re-verify
                                            </Button>
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
                                                className="border-white/20 text-slate-300 hover:bg-white/10"
                                            >
                                                Reset to Pending
                                            </Button>
                                        </div>
                                    )}
                                </DialogFooter>
                            </div>
                        )}
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
