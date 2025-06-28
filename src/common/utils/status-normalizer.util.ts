/**
 * Utilitário para normalização de status (sempre lowercase)
 */
export class StatusNormalizer {
    /**
     * Normaliza qualquer status para lowercase padrão
     */
    static normalize(status: string): string {
        return status?.toLowerCase() || 'pending';
    }

    /**
     * Valida se o status é válido
     */
    static isValid(status: string, validStatuses: string[]): boolean {
        return validStatuses.includes(status?.toLowerCase());
    }
}

// Enum compartilhado para Orders
export enum OrderStatusEnum {
    PENDING = 'pending',
    PROCESSING = 'processing',
    PAYMENT_FAILED = 'payment_failed',
    SHIPPED = 'shipped',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled',
    COMPLETED = 'completed',
    CONFIRMED = 'confirmed'
}

// Enum compartilhado para Products
export enum ProductStatusEnum {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    DRAFT = 'draft'
}