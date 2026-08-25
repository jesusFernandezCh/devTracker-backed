import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { IS_PUBLIC_KEY, JwtPayload } from '../decorators/auth.decorators';
import {
  PERMISOS_KEY,
  RequerimientoPermiso,
} from '../decorators/permisos.decorator';
import { ROL_SUPER_ADMIN_ID } from '../../constants';

@Injectable()
export class PermisosGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requeridos = this.reflector.getAllAndOverride<RequerimientoPermiso[] | undefined>(
      PERMISOS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requeridos || requeridos.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;
    if (!user) return false;

    if (user.rolId === ROL_SUPER_ADMIN_ID) return true;

    for (const { accion, recurso } of requeridos) {
      const permiso = await this.prisma.rolPermiso.findUnique({
        where: { rolId_recurso_accion: { rolId: user.rolId, recurso, accion } },
      });
      if (!permiso) {
        throw new ForbiddenException(`Permiso requerido: ${accion} en ${recurso}`);
      }
    }
    return true;
  }
}
