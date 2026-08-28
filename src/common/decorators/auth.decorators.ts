import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marca una ruta como pública (no requiere autenticación). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Tipo del payload JWT. */
export interface JwtPayload {
  sub: string;
  rolId: string;
}

/** Extrae el usuario autenticado (payload JWT) del request.
 *  Si se pasa una clave (p.ej. @CurrentUser('sub')), retorna solo ese campo. */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    return data ? user?.[data] : user;
  },
);
