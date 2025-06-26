/**
 * Definições de tipos para o banco de dados LaMusic
 * Baseado no schema definido em schemaBD.txt
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
  price: number;
  compare_price?: number;
  cost_price?: number;
  sku?: string;
  barcode?: string;
  stock_quantity: number;
  min_stock_alert: number;
  weight?: number;
  dimensions_length?: number;
  dimensions_width?: number;
  dimensions_height?: number;
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

export interface DatabaseProductLog {
  id: string;
  product_id: string;
  action: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  responsible_user_id: string;
  created_at: string;
}

/**
 * Tipo principal do banco de dados com todas as tabelas
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
      product_logs: {
        Row: DatabaseProductLog;
        Insert: Omit<DatabaseProductLog, 'id' | 'created_at'>;
        Update: never; // Logs são imutáveis
      };
    };
  };
}
