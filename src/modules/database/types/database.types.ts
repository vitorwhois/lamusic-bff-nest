/**
 * Definições de tipos para o banco de dados LaMusic
 * Baseado no schema schemaBD.txt - VERSÃO COMPLETA E CORRIGIDA
 * CORREÇÃO: DECIMAL = string, JSONB = Record<string, any>
 */

export interface DatabaseUser {
  id: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface DatabaseAddress {
  id: string;
  user_id: string;
  type: string;
  label: string;
  recipient_name: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseSupplier {
  id: string;
  name: string;
  cnpj: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  contact_person?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface DatabaseCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface DatabaseProduct {
  id: string;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  price: string; // DECIMAL → string
  compare_price?: string; // DECIMAL → string
  cost_price?: string; // DECIMAL → string
  sku?: string;
  barcode?: string;
  stock_quantity: number;
  min_stock_alert: number;
  weight?: string; // DECIMAL → string
  dimensions_length?: string; // DECIMAL → string
  dimensions_width?: string; // DECIMAL → string
  dimensions_height?: string; // DECIMAL → string
  status: string;
  featured: boolean;
  meta_title?: string;
  meta_description?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface DatabaseProductCategory {
  id: string;
  product_id: string;
  category_id: string;
}

export interface DatabaseProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text?: string;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface DatabaseCart {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseCartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  price: string; // DECIMAL → string
  created_at: string;
  updated_at: string;
}

export interface DatabaseCoupon {
  id: string;
  code: string;
  type: string;
  value: string; // DECIMAL → string
  min_order_amount?: string; // DECIMAL → string
  max_discount_amount?: string; // DECIMAL → string
  usage_limit?: number;
  used_count: number;
  is_active: boolean;
  valid_from?: string;
  valid_until?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseOrderAddress {
  id: string;
  recipient_name: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  created_at: string;
}

export interface DatabaseOrder {
  id: string;
  user_id: string;
  order_number: string;
  status: string;
  subtotal: string; // DECIMAL → string
  shipping_cost: string; // DECIMAL → string
  tax_amount: string; // DECIMAL → string
  discount_amount: string; // DECIMAL → string
  total_amount: string; // DECIMAL → string
  currency: string;
  shipping_address_snapshot_id?: string;
  billing_address_snapshot_id?: string;
  coupon_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: string; // DECIMAL → string
  total_price: string; // DECIMAL → string
  product_name_snapshot: string;
  product_sku_snapshot?: string;
  created_at: string;
}

export interface DatabasePayment {
  id: string;
  order_id: string;
  amount: string; // DECIMAL → string
  method: string;
  status: string;
  transaction_id?: string;
  gateway_response?: Record<string, any>; // JSONB → Record<string, any>
  error_code?: string;
  error_message?: string;
  attempt_number: number;
  processed_at?: string;
  created_at: string;
}

export interface DatabaseProductLog {
  id: string;
  product_id: string;
  action: string;
  old_values?: Record<string, any>; // JSONB → Record<string, any>
  new_values?: Record<string, any>; // JSONB → Record<string, any>
  responsible_user_id: string;
  created_at: string;
}

/**
 * Tipo principal do banco de dados com todas as tabelas
 * Baseado no schema schemaBD.txt
 */
export interface Database {
  public: {
    Tables: {
      users: {
        Row: DatabaseUser;
        Insert: Omit<DatabaseUser, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DatabaseUser, 'id' | 'created_at'>>;
      };
      addresses: {
        Row: DatabaseAddress;
        Insert: Omit<DatabaseAddress, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DatabaseAddress, 'id' | 'created_at'>>;
      };
      suppliers: {
        Row: DatabaseSupplier;
        Insert: Omit<DatabaseSupplier, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DatabaseSupplier, 'id' | 'created_at'>>;
      };
      categories: {
        Row: DatabaseCategory;
        Insert: Omit<DatabaseCategory, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DatabaseCategory, 'id' | 'created_at'>>;
      };
      products: {
        Row: DatabaseProduct;
        Insert: Omit<DatabaseProduct, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DatabaseProduct, 'id' | 'created_at'>>;
      };
      product_categories: {
        Row: DatabaseProductCategory;
        Insert: Omit<DatabaseProductCategory, 'id'>;
        Update: Partial<Omit<DatabaseProductCategory, 'id'>>;
      };
      product_images: {
        Row: DatabaseProductImage;
        Insert: Omit<DatabaseProductImage, 'id' | 'created_at'>;
        Update: Partial<Omit<DatabaseProductImage, 'id' | 'created_at'>>;
      };
      carts: {
        Row: DatabaseCart;
        Insert: Omit<DatabaseCart, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DatabaseCart, 'id' | 'created_at'>>;
      };
      cart_items: {
        Row: DatabaseCartItem;
        Insert: Omit<DatabaseCartItem, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DatabaseCartItem, 'id' | 'created_at'>>;
      };
      coupons: {
        Row: DatabaseCoupon;
        Insert: Omit<DatabaseCoupon, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DatabaseCoupon, 'id' | 'created_at'>>;
      };
      order_addresses: {
        Row: DatabaseOrderAddress;
        Insert: Omit<DatabaseOrderAddress, 'id' | 'created_at'>;
        Update: Partial<Omit<DatabaseOrderAddress, 'id' | 'created_at'>>;
      };
      orders: {
        Row: DatabaseOrder;
        Insert: Omit<DatabaseOrder, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DatabaseOrder, 'id' | 'created_at'>>;
      };
      order_items: {
        Row: DatabaseOrderItem;
        Insert: Omit<DatabaseOrderItem, 'id' | 'created_at'>;
        Update: Partial<Omit<DatabaseOrderItem, 'id' | 'created_at'>>;
      };
      payments: {
        Row: DatabasePayment;
        Insert: Omit<DatabasePayment, 'id' | 'created_at'>;
        Update: Partial<Omit<DatabasePayment, 'id' | 'created_at'>>;
      };
      product_logs: {
        Row: DatabaseProductLog;
        Insert: Omit<DatabaseProductLog, 'id' | 'created_at'>;
        Update: never; // Logs são imutáveis
      };
    };
  };
}

/**
 * Enums e constantes baseadas no schema
 */
export const ProductStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  OUT_OF_STOCK: 'out_of_stock',
} as const;

export const OrderStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

export const PaymentStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

export const PaymentMethod = {
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  PIX: 'pix',
  BANK_SLIP: 'bank_slip',
  BANK_TRANSFER: 'bank_transfer',
} as const;

export const CouponType = {
  PERCENTAGE: 'percentage',
  FIXED_AMOUNT: 'fixed_amount',
} as const;

export const CartStatus = {
  ACTIVE: 'active',
  ABANDONED: 'abandoned',
  CONVERTED: 'converted',
} as const;

export const AddressType = {
  SHIPPING: 'shipping',
  BILLING: 'billing',
  BOTH: 'both',
} as const;

export const UserRole = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
} as const;

export const ProductLogAction = {
  CREATED: 'created',
  UPDATED: 'updated',
  DELETED: 'deleted',
  STOCK_CHANGED: 'stock_changed',
  PRICE_CHANGED: 'price_changed',
  STATUS_CHANGED: 'status_changed',
} as const;

export type ProductStatusType = typeof ProductStatus[keyof typeof ProductStatus];
export type OrderStatusType = typeof OrderStatus[keyof typeof OrderStatus];
export type PaymentStatusType = typeof PaymentStatus[keyof typeof PaymentStatus];
export type PaymentMethodType = typeof PaymentMethod[keyof typeof PaymentMethod];
export type CouponTypeType = typeof CouponType[keyof typeof CouponType];
export type CartStatusType = typeof CartStatus[keyof typeof CartStatus];
export type AddressTypeType = typeof AddressType[keyof typeof AddressType];
export type UserRoleType = typeof UserRole[keyof typeof UserRole];
export type ProductLogActionType = typeof ProductLogAction[keyof typeof ProductLogAction];