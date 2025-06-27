import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { IUsersRepository } from './iusers.repository';
import { User } from '../entities/user.entity';

@Injectable()
export class SupabaseUsersRepository implements IUsersRepository {
    private readonly logger = new Logger(SupabaseUsersRepository.name);

    constructor(private readonly supabaseService: SupabaseService) { }

    async findByEmail(email: string): Promise<User | null> {
        const client = this.supabaseService.getClient();
        const { data, error } = await client
            .from('users')
            .select('*')
            .eq('email', email)
            .is('deleted_at', null) // Garante que não estamos buscando usuários deletados
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116: "No rows found"
            this.logger.error(`Erro ao buscar usuário por email: ${error.message}`, error.stack);
            throw new Error('Database error while fetching user.');
        }

        return data as User | null;
    }

    async findById(id: string): Promise<User | null> {
        const client = this.supabaseService.getClient();
        const { data, error } = await client
            .from('users')
            .select('*')
            .eq('id', id)
            .is('deleted_at', null)
            .single();

        if (error && error.code !== 'PGRST116') {
            this.logger.error(`Erro ao buscar usuário por ID: ${error.message}`, error.stack);
            throw new Error('Database error while fetching user.');
        }

        return data as User | null;
    }
}