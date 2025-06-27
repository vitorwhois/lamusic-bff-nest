import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { SupabaseUsersRepository } from './repositories/supabase-users.repository';

@Module({
    providers: [
        UsersService,
        {
            provide: 'IUsersRepository',
            useClass: SupabaseUsersRepository,
        },
    ],
    exports: [UsersService],
})
export class UsersModule { }