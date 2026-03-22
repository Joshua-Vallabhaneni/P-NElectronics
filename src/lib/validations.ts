import { z } from 'zod';

export const quoteFormSchema = z.object({
    company_name: z.string().optional(),
    contact_name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().optional(),
    category: z.enum(['laptop', 'desktop', 'gpu', 'phone', 'other']),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    brand_model: z.string().optional(),
    processor: z.string().optional(),
    ram: z.string().optional(),
    storage_type: z.string().optional(),
    vram: z.string().optional(),
    condition: z.enum(['grade_a', 'grade_b', 'refurbished', 'parts_only']),
    comments: z.string().optional(),
});

export type QuoteFormData = z.infer<typeof quoteFormSchema>;

export const productFilterSchema = z.object({
    category: z.string().optional(),
    condition: z.string().optional(),
    is_bulk_lot: z.boolean().optional(),
    search: z.string().optional(),
});

export type ProductFilters = z.infer<typeof productFilterSchema>;
