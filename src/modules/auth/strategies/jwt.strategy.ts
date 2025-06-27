import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET'),
        });
    }

    // O NestJS chama este método após validar o token com sucesso.
    // O retorno deste método é injetado no objeto `request.user`.
    async validate(payload: { userId: string; sub: string }) {
        // Neste ponto, o token é válido. O payload é o que definimos ao criar o token.
        // Aqui você poderia buscar o usuário no banco para adicionar mais informações.
        // Por agora, vamos apenas retornar o payload decodificado.
        if (!payload.sub) {
            throw new UnauthorizedException();
        }
        return { userId: payload.userId, email: payload.sub };
    }
}