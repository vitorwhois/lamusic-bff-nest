export class Product {
    id: string;
    name: string;
    slug: string;
    description?: string;
    shortDescription?: string;
    price: number;
    comparePrice?: number;
    costPrice?: number;
    sku?: string;
    barcode?: string;
    stockQuantity: number;
    minStockAlert: number;
    status: string;
    featured: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}