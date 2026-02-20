/**
 * DATABASE TYPES
 * Defines the structure of the Supabase database for P&N Electronics
 */

export type ConditionGrade = 'A' | 'B' | 'refurbished' | 'parts';
export type QuoteStatus = 'pending' | 'quoted' | 'accepted' | 'rejected';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      // USER PROFILES TABLE
      user_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: 'admin' | 'user';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'admin' | 'user';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'admin' | 'user';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // PRODUCT CATEGORIES
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          icon: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          icon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          icon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // PRODUCTS/INVENTORY
      products: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          category_id: string | null;
          brand: string | null;
          model: string | null;
          processor: string | null;
          ram: string | null;
          storage: string | null;
          condition: ConditionGrade;
          quantity: number;
          price: number | null;
          is_bulk_lot: boolean;
          lot_number: string | null;
          images: string[] | null;
          is_available: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          category_id?: string | null;
          brand?: string | null;
          model?: string | null;
          processor?: string | null;
          ram?: string | null;
          storage?: string | null;
          condition: ConditionGrade;
          quantity?: number;
          price?: number | null;
          is_bulk_lot?: boolean;
          lot_number?: string | null;
          images?: string[] | null;
          is_available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          category_id?: string | null;
          brand?: string | null;
          model?: string | null;
          processor?: string | null;
          ram?: string | null;
          storage?: string | null;
          condition?: ConditionGrade;
          quantity?: number;
          price?: number | null;
          is_bulk_lot?: boolean;
          lot_number?: string | null;
          images?: string[] | null;
          is_available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };

      // QUOTE REQUESTS (Sell To Us)
      quote_requests: {
        Row: {
          id: string;
          company_name: string | null;
          contact_name: string;
          email: string;
          phone: string | null;
          category: string;
          quantity: number;
          brand_model: string | null;
          processor: string | null;
          ram: string | null;
          storage_type: string | null;
          condition: string;
          spreadsheet_url: string | null;
          image_urls: string[] | null;
          status: QuoteStatus;
          admin_notes: string | null;
          quoted_price: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_name?: string | null;
          contact_name: string;
          email: string;
          phone?: string | null;
          category: string;
          quantity: number;
          brand_model?: string | null;
          processor?: string | null;
          ram?: string | null;
          storage_type?: string | null;
          condition: string;
          spreadsheet_url?: string | null;
          image_urls?: string[] | null;
          status?: QuoteStatus;
          admin_notes?: string | null;
          quoted_price?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_name?: string | null;
          contact_name?: string;
          email?: string;
          phone?: string | null;
          category?: string;
          quantity?: number;
          brand_model?: string | null;
          processor?: string | null;
          ram?: string | null;
          storage_type?: string | null;
          condition?: string;
          spreadsheet_url?: string | null;
          image_urls?: string[] | null;
          status?: QuoteStatus;
          admin_notes?: string | null;
          quoted_price?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // VERIFIED ITEMS (from accepted submissions)
      verified_items: {
        Row: {
          id: string;
          quote_request_id: string | null;
          category: string;
          brand: string | null;
          model: string | null;
          processor: string | null;
          ram: string | null;
          storage: string | null;
          condition: string;
          quantity: number;
          quoted_price: number | null;
          admin_notes: string | null;
          images: string[] | null;
          is_listed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          quote_request_id?: string | null;
          category: string;
          brand?: string | null;
          model?: string | null;
          processor?: string | null;
          ram?: string | null;
          storage?: string | null;
          condition: string;
          quantity?: number;
          quoted_price?: number | null;
          admin_notes?: string | null;
          images?: string[] | null;
          is_listed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          quote_request_id?: string | null;
          category?: string;
          brand?: string | null;
          model?: string | null;
          processor?: string | null;
          ram?: string | null;
          storage?: string | null;
          condition?: string;
          quantity?: number;
          quoted_price?: number | null;
          admin_notes?: string | null;
          images?: string[] | null;
          is_listed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "verified_items_quote_request_id_fkey";
            columns: ["quote_request_id"];
            isOneToOne: false;
            referencedRelation: "quote_requests";
            referencedColumns: ["id"];
          }
        ];
      };

      // LOTS (bundles of items)
      lots: {
        Row: {
          id: string;
          lot_number: string;
          title: string;
          description: string | null;
          total_price: number | null;
          is_available: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lot_number: string;
          title: string;
          description?: string | null;
          total_price?: number | null;
          is_available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          lot_number?: string;
          title?: string;
          description?: string | null;
          total_price?: number | null;
          is_available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // LOT ITEMS (junction table)
      lot_items: {
        Row: {
          id: string;
          lot_id: string;
          verified_item_id: string | null;
          product_id: string | null;
          quantity: number;
        };
        Insert: {
          id?: string;
          lot_id: string;
          verified_item_id?: string | null;
          product_id?: string | null;
          quantity?: number;
        };
        Update: {
          id?: string;
          lot_id?: string;
          verified_item_id?: string | null;
          product_id?: string | null;
          quantity?: number;
        };
        Relationships: [
          {
            foreignKeyName: "lot_items_lot_id_fkey";
            columns: ["lot_id"];
            isOneToOne: false;
            referencedRelation: "lots";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lot_items_verified_item_id_fkey";
            columns: ["verified_item_id"];
            isOneToOne: false;
            referencedRelation: "verified_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lot_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      condition_grade: ConditionGrade;
      quote_status: QuoteStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Helper types for easier use
export type Category = Database['public']['Tables']['categories']['Row'];
export type Product = Database['public']['Tables']['products']['Row'] & {
  category?: Category | null;
};
export type QuoteRequest = Database['public']['Tables']['quote_requests']['Row'];
export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

// Insert types
export type ProductInsert = Database['public']['Tables']['products']['Insert'];
export type QuoteRequestInsert = Database['public']['Tables']['quote_requests']['Insert'];
export type CategoryInsert = Database['public']['Tables']['categories']['Insert'];

// Verified Items (from accepted submissions)
export type VerifiedItem = {
  id: string;
  quote_request_id: string | null;
  category: string;
  brand: string | null;
  model: string | null;
  processor: string | null;
  ram: string | null;
  storage: string | null;
  condition: string;
  quantity: number;
  quoted_price: number | null;
  admin_notes: string | null;
  images: string[] | null;
  is_listed: boolean;
  created_at: string;
  updated_at: string;
};

// Lots (bundles of items)
export type Lot = {
  id: string;
  lot_number: string;
  title: string;
  description: string | null;
  total_price: number | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
};

// Lot Items (junction table)
export type LotItem = {
  id: string;
  lot_id: string;
  verified_item_id: string | null;
  product_id: string | null;
  quantity: number;
};
