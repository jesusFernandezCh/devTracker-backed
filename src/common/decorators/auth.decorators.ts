import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marca una ruta como pública (no requiere autenticación). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Tipo del payload JWT. */
export interface JwtPayload {
  sub: string;
  rolId: string;
}

/** Extrae el usuario autenticado (payload JWT) del request. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as JwtPayload;
  },
);
