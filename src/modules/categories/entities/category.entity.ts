export class Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    parentId?: string | null;
    sortOrder: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}