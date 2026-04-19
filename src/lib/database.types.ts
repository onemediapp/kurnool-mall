// Auto-generated database types for Supabase client type safety.
// Run `supabase gen types typescript --local` after linking your project to regenerate.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          phone: string
          name: string | null
          email: string | null
          role: 'customer' | 'vendor' | 'admin'
          language_pref: string
          is_verified: boolean
          is_deleted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          phone: string
          name?: string | null
          email?: string | null
          role?: 'customer' | 'vendor' | 'admin'
          language_pref?: string
          is_verified?: boolean
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          phone?: string
          name?: string | null
          email?: string | null
          role?: 'customer' | 'vendor' | 'admin'
          language_pref?: string
          is_verified?: boolean
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      addresses: {
        Row: {
          id: string
          user_id: string
          label: string
          address_line: string
          city: string
          pincode: string
          lat: number | null
          lng: number | null
          is_default: boolean
          is_deleted: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          label?: string
          address_line: string
          city?: string
          pincode: string
          lat?: number | null
          lng?: number | null
          is_default?: boolean
          is_deleted?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          label?: string
          address_line?: string
          city?: string
          pincode?: string
          lat?: number | null
          lng?: number | null
          is_default?: boolean
          is_deleted?: boolean
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: 'addresses_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] }
        ]
      }
      categories: {
        Row: {
          id: string
          name_en: string
          name_te: string
          slug: string
          icon_url: string | null
          parent_id: string | null
          sort_order: number
          is_active: boolean
        }
        Insert: {
          id?: string
          name_en: string
          name_te: string
          slug: string
          icon_url?: string | null
          parent_id?: string | null
          sort_order?: number
          is_active?: boolean
        }
        Update: {
          id?: string
          name_en?: string
          name_te?: string
          slug?: string
          icon_url?: string | null
          parent_id?: string | null
          sort_order?: number
          is_active?: boolean
        }
        Relationships: []
      }
      vendors: {
        Row: {
          id: string
          user_id: string
          shop_name: string
          description: string | null
          category_ids: string[]
          logo_url: string | null
          gstin: string | null
          fssai_no: string | null
          kyc_status: 'pending' | 'approved' | 'rejected'
          rating: number
          rating_count: number
          commission_rate: number
          is_active: boolean
          address_line: string
          lat: number | null
          lng: number | null
          is_deleted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          shop_name: string
          description?: string | null
          category_ids?: string[]
          logo_url?: string | null
          gstin?: string | null
          fssai_no?: string | null
          kyc_status?: 'pending' | 'approved' | 'rejected'
          rating?: number
          rating_count?: number
          commission_rate?: number
          is_active?: boolean
          address_line?: string
          lat?: number | null
          lng?: number | null
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          shop_name?: string
          description?: string | null
          category_ids?: string[]
          logo_url?: string | null
          gstin?: string | null
          fssai_no?: string | null
          kyc_status?: 'pending' | 'approved' | 'rejected'
          rating?: number
          rating_count?: number
          commission_rate?: number
          is_active?: boolean
          address_line?: string
          lat?: number | null
          lng?: number | null
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'vendors_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] }
        ]
      }
      products: {
        Row: {
          id: string
          vendor_id: string
          category_id: string
          name_en: string
          name_te: string
          description_en: string | null
          description_te: string | null
          price_mrp: number
          price_selling: number
          images: string[]
          stock_qty: number
          unit: string
          is_available: boolean
          is_deleted: boolean
          search_vector: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          category_id: string
          name_en: string
          name_te: string
          description_en?: string | null
          description_te?: string | null
          price_mrp: number
          price_selling: number
          images?: string[]
          stock_qty?: number
          unit?: string
          is_available?: boolean
          is_deleted?: boolean
          search_vector?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          category_id?: string
          name_en?: string
          name_te?: string
          description_en?: string | null
          description_te?: string | null
          price_mrp?: number
          price_selling?: number
          images?: string[]
          stock_qty?: number
          unit?: string
          is_available?: boolean
          is_deleted?: boolean
          search_vector?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'products_vendor_id_fkey'; columns: ['vendor_id']; referencedRelation: 'vendors'; referencedColumns: ['id'] },
          { foreignKeyName: 'products_category_id_fkey'; columns: ['category_id']; referencedRelation: 'categories'; referencedColumns: ['id'] }
        ]
      }
      orders: {
        Row: {
          id: string
          order_number: string
          customer_id: string
          vendor_id: string
          status: 'pending' | 'accepted' | 'rejected' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled'
          subtotal: number
          delivery_fee: number
          discount: number
          grand_total: number
          payment_method: 'upi' | 'card' | 'cod'
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          delivery_address_id: string | null
          delivery_address_snapshot: Json
          rider_id: string | null
          rider_name: string | null
          rider_phone: string | null
          notes: string | null
          rejection_reason: string | null
          is_deleted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number?: string
          customer_id: string
          vendor_id: string
          status?: 'pending' | 'accepted' | 'rejected' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled'
          subtotal?: number
          delivery_fee?: number
          discount?: number
          grand_total?: number
          payment_method: 'upi' | 'card' | 'cod'
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          delivery_address_id?: string | null
          delivery_address_snapshot?: Json
          rider_id?: string | null
          rider_name?: string | null
          rider_phone?: string | null
          notes?: string | null
          rejection_reason?: string | null
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          customer_id?: string
          vendor_id?: string
          status?: 'pending' | 'accepted' | 'rejected' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled'
          subtotal?: number
          delivery_fee?: number
          discount?: number
          grand_total?: number
          payment_method?: 'upi' | 'card' | 'cod'
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          delivery_address_id?: string | null
          delivery_address_snapshot?: Json
          rider_id?: string | null
          rider_name?: string | null
          rider_phone?: string | null
          notes?: string | null
          rejection_reason?: string | null
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'orders_customer_id_fkey'; columns: ['customer_id']; referencedRelation: 'users'; referencedColumns: ['id'] },
          { foreignKeyName: 'orders_vendor_id_fkey'; columns: ['vendor_id']; referencedRelation: 'vendors'; referencedColumns: ['id'] }
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          product_name: string
          product_image: string | null
          quantity: number
          unit_price: number
          total_price: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          product_name: string
          product_image?: string | null
          quantity: number
          unit_price: number
          total_price: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          product_image?: string | null
          quantity?: number
          unit_price?: number
          total_price?: number
        }
        Relationships: [
          { foreignKeyName: 'order_items_order_id_fkey'; columns: ['order_id']; referencedRelation: 'orders'; referencedColumns: ['id'] },
          { foreignKeyName: 'order_items_product_id_fkey'; columns: ['product_id']; referencedRelation: 'products'; referencedColumns: ['id'] }
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      decrement_stock: { Args: { p_product_id: string; p_quantity: number }; Returns: undefined }
      increment_stock: { Args: { p_product_id: string; p_quantity: number }; Returns: undefined }
      get_vendor_stats: {
        Args: { p_vendor_id: string }
        Returns: Array<{
          total_orders: number
          pending_orders: number
          delivered_orders: number
          total_gmv: number
          avg_rating: number
          total_products: number
        }>
      }
    }
    Enums: {
      user_role: 'customer' | 'vendor' | 'admin'
      order_status: 'pending' | 'accepted' | 'rejected' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled'
      payment_method: 'upi' | 'card' | 'cod'
      payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
      kyc_status: 'pending' | 'approved' | 'rejected'
    }
    CompositeTypes: Record<string, never>
  }
}
