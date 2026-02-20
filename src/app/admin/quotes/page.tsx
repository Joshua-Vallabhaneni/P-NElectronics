'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, Building, Package, Clock, DollarSign, CheckCircle, XCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Loader } from '@/components/common/Loader';
import { supabase } from '@/lib/supabase';
import type { QuoteRequest, QuoteStatus } from '@/types/database';
import { toast } from 'sonner';

const statusConfig: Record<QuoteStatus, { label: string; color: string; icon: any }> = {
    pending: { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
    quoted: { label: 'Quoted', color: 'bg-blue-500/20 text-blue-400', icon: DollarSign },
    accepted: { label: 'Accepted', color: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle },
    rejected: { label: 'Rejected', color: 'bg-red-500/20 text-red-400', icon: XCircle },
};

function QuotesContent() {
    const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [updateData, setUpdateData] = useState({
        status: '' as QuoteStatus | '',
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
            setQuotes(data || []);
        } catch (error) {
            console.error('Error fetching quotes:', error);
            toast.error('Failed to load quotes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuotes();
    }, []);

    const openDetail = (quote: QuoteRequest) => {
        setSelectedQuote(quote);
        setUpdateData({
            status: quote.status,
            quoted_price: quote.quoted_price?.toString() || '',
            admin_notes: quote.admin_notes || '',
        });
        setDetailOpen(true);
    };

    const updateQuote = async () => {
        if (!selectedQuote) return;

        setUpdating(true);
        try {
            const { error } = await supabase
                .from('quote_requests')
                .update({
                    status: updateData.status as QuoteStatus,
                    quoted_price: updateData.quoted_price ? parseFloat(updateData.quoted_price) : null,
                    admin_notes: updateData.admin_notes || null,
                })
                .eq('id', selectedQuote.id);

            if (error) throw error;

            setQuotes(quotes.map((q) =>
                q.id === selectedQuote.id
                    ? {
                        ...q,
                        status: updateData.status as QuoteStatus,
                        quoted_price: updateData.quoted_price ? parseFloat(updateData.quoted_price) : null,
                        admin_notes: updateData.admin_notes || null,
                    }
                    : q
            ));
            toast.success('Quote updated successfully');
            setDetailOpen(false);
        } catch (error) {
            console.error('Error updating quote:', error);
            toast.error('Failed to update quote');
        } finally {
            setUpdating(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="min-h-screen bg-slate-900">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/admin" className="text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Quote Requests</h1>
                        <p className="text-slate-400">Review and respond to customer submissions</p>
                    </div>
                </div>

                {/* Quotes Table */}
                <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="p-8">
                                <Loader message="Loading quotes..." />
                            </div>
                        ) : quotes.length === 0 ? (
                            <div className="p-16 text-center">
                                <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-white mb-2">No quote requests yet</h3>
                                <p className="text-slate-400">Quote requests will appear here when customers submit them.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-white/10 hover:bg-transparent">
                                        <TableHead className="text-slate-400">Contact</TableHead>
                                        <TableHead className="text-slate-400">Category</TableHead>
                                        <TableHead className="text-slate-400">Qty</TableHead>
                                        <TableHead className="text-slate-400">Condition</TableHead>
                                        <TableHead className="text-slate-400">Status</TableHead>
                                        <TableHead className="text-slate-400">Date</TableHead>
                                        <TableHead className="text-slate-400 text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {quotes.map((quote) => {
                                        const status = statusConfig[quote.status];
                                        const StatusIcon = status.icon;
                                        return (
                                            <TableRow key={quote.id} className="border-white/10 hover:bg-white/5">
                                                <TableCell>
                                                    <div>
                                                        <p className="text-white font-medium">{quote.contact_name}</p>
                                                        <p className="text-slate-400 text-sm">{quote.email}</p>
                                                        {quote.company_name && (
                                                            <p className="text-slate-500 text-xs">{quote.company_name}</p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-slate-300 capitalize">{quote.category}</TableCell>
                                                <TableCell className="text-slate-300">{quote.quantity}</TableCell>
                                                <TableCell className="text-slate-300 capitalize">
                                                    {quote.condition.replace('_', ' ')}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={`${status.color} border-0`}>
                                                        <StatusIcon className="w-3 h-3 mr-1" />
                                                        {status.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-slate-400 text-sm">
                                                    {formatDate(quote.created_at)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openDetail(quote)}
                                                        className="border-white/20 text-white hover:bg-white/10"
                                                    >
                                                        View Details
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Detail Dialog */}
                <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                    <DialogContent className="bg-slate-800 border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
                        {selectedQuote && (
                            <>
                                <DialogHeader>
                                    <DialogTitle className="text-white text-xl">Quote Request Details</DialogTitle>
                                    <DialogDescription className="text-slate-400">
                                        Submitted {formatDate(selectedQuote.created_at)}
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-6 py-4">
                                    {/* Contact Info */}
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Contact Information</h4>
                                        <div className="bg-white/5 rounded-lg p-4 space-y-2">
                                            <div className="flex items-center gap-2 text-white">
                                                <Building className="w-4 h-4 text-slate-400" />
                                                {selectedQuote.company_name || 'No company'}
                                            </div>
                                            <div className="flex items-center gap-2 text-white">
                                                <span className="w-4 h-4" />
                                                {selectedQuote.contact_name}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-slate-400" />
                                                <a href={`mailto:${selectedQuote.email}`} className="text-emerald-400 hover:underline">
                                                    {selectedQuote.email}
                                                </a>
                                            </div>
                                            {selectedQuote.phone && (
                                                <div className="flex items-center gap-2">
                                                    <Phone className="w-4 h-4 text-slate-400" />
                                                    <a href={`tel:${selectedQuote.phone}`} className="text-emerald-400 hover:underline">
                                                        {selectedQuote.phone}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Item Details */}
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Item Details</h4>
                                        <div className="bg-white/5 rounded-lg p-4 grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-slate-400 text-sm">Category</p>
                                                <p className="text-white capitalize">{selectedQuote.category}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-400 text-sm">Quantity</p>
                                                <p className="text-white">{selectedQuote.quantity}</p>
                                            </div>
                                            {selectedQuote.brand_model && (
                                                <div>
                                                    <p className="text-slate-400 text-sm">Brand/Model</p>
                                                    <p className="text-white">{selectedQuote.brand_model}</p>
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-slate-400 text-sm">Condition</p>
                                                <p className="text-white capitalize">{selectedQuote.condition.replace('_', ' ')}</p>
                                            </div>
                                            {selectedQuote.processor && (
                                                <div>
                                                    <p className="text-slate-400 text-sm">Processor</p>
                                                    <p className="text-white">{selectedQuote.processor}</p>
                                                </div>
                                            )}
                                            {selectedQuote.ram && (
                                                <div>
                                                    <p className="text-slate-400 text-sm">RAM</p>
                                                    <p className="text-white">{selectedQuote.ram}</p>
                                                </div>
                                            )}
                                            {selectedQuote.storage_type && (
                                                <div>
                                                    <p className="text-slate-400 text-sm">Storage</p>
                                                    <p className="text-white">{selectedQuote.storage_type}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Attachments */}
                                    {(selectedQuote.spreadsheet_url || (selectedQuote.image_urls && selectedQuote.image_urls.length > 0)) && (
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Attachments</h4>
                                            <div className="bg-white/5 rounded-lg p-4 space-y-3">
                                                {selectedQuote.spreadsheet_url && (
                                                    <a
                                                        href={selectedQuote.spreadsheet_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 text-emerald-400 hover:underline"
                                                    >
                                                        <FileSpreadsheet className="w-4 h-4" />
                                                        Download Spreadsheet
                                                    </a>
                                                )}
                                                {selectedQuote.image_urls && selectedQuote.image_urls.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedQuote.image_urls.map((url, index) => (
                                                            <a
                                                                key={index}
                                                                href={url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="w-16 h-16 rounded-lg overflow-hidden"
                                                            >
                                                                <img src={url} alt="" className="w-full h-full object-cover" />
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Update Form */}
                                    <div className="space-y-4 pt-4 border-t border-white/10">
                                        <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Update Quote</h4>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-slate-300">Status</Label>
                                                <Select
                                                    value={updateData.status}
                                                    onValueChange={(value) => setUpdateData({ ...updateData, status: value as QuoteStatus })}
                                                >
                                                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Object.entries(statusConfig).map(([value, config]) => (
                                                            <SelectItem key={value} value={value}>
                                                                {config.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label className="text-slate-300">Quoted Price ($)</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={updateData.quoted_price}
                                                    onChange={(e) => setUpdateData({ ...updateData, quoted_price: e.target.value })}
                                                    placeholder="Enter amount"
                                                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="text-slate-300">Admin Notes</Label>
                                            <Textarea
                                                value={updateData.admin_notes}
                                                onChange={(e) => setUpdateData({ ...updateData, admin_notes: e.target.value })}
                                                placeholder="Internal notes about this quote..."
                                                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() => setDetailOpen(false)}
                                        className="border-white/20 text-white hover:bg-white/10"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={updateQuote}
                                        disabled={updating}
                                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
                                    >
                                        {updating ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}

export default function AdminQuotesPage() {
    return (
        <ProtectedRoute>
            <QuotesContent />
        </ProtectedRoute>
    );
}
