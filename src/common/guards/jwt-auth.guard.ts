import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(err: unknown, user: TUser | null): TUser {
    if (err || !user) {
      throw new UnauthorizedException('Sesión inválida o expirada');
    }
    return user;
  }
}
