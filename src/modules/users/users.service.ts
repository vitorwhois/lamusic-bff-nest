import { Inject, Injectable } from '@nestjs/common';
import { IUsersRepository } from './repositories/iusers.repository';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
    constructor(
        @Inject('IUsersRepository')
        private readonly usersRepository: IUsersRepository,
    ) { }

    /**
     * Encontra um usuário pelo email, delegando para o repositório.
     * @param email - O email do usuário a ser encontrado.
     */
    async findByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findByEmail(email);
    }

    /**
     * Encontra um usuário pelo ID, delegando para o repositório.
     * @param id - O UUID do usuário.
     */
    async findById(id: string): Promise<User | null> {
        return this.usersRepository.findById(id);
    }
}