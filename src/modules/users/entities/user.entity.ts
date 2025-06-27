export class User {
    id: string;
    name: string;
    email: string;
    password?: string;
    phone?: string;
    role: string;
    email_verified: boolean;
    created_at: Date;
    updated_at: Date;
    deleted_at?: Date;
}