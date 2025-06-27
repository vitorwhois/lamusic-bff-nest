import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
    ) { }

    async login(email: string, pass: string): Promise<{ accessToken: string }> {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new UnauthorizedException('Credenciais inválidas.');
        }

        const isPasswordMatching = await bcrypt.compare(pass, user.password);
        if (!isPasswordMatching) {
            throw new UnauthorizedException('Credenciais inválidas.');
        }

        const payload = { username: user.name, sub: user.id };

        return {
            accessToken: this.jwtService.sign(payload),
        };
    }
}