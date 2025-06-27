import { User } from '../entities/user.entity';

export interface IUsersRepository {
    /**
     * Encontra um usuário pelo seu endereço de e-mail.
     * @param email - O e-mail a ser pesquisado.
     * @returns Uma promessa que resolve para a entidade User ou null se não for encontrado.
     */
    findByEmail(email: string): Promise<User | null>;

    /**
     * Encontra um usuário pelo seu ID.
     * @param id - O UUID do usuário.
     * @returns Uma promessa que resolve para a entidade User ou null se não for encontrado.
     */
    findById(id: string): Promise<User | null>;
}