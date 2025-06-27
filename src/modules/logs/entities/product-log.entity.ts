export class ProductLog {
    id: string;
    productId: string;
    action: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    responsibleUserId: string;
    createdAt: Date;
}