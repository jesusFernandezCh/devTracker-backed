import { SetMetadata } from '@nestjs/common';
import { Accion, Recurso } from '@prisma/client';

export const PERMISOS_KEY = 'permisos';

export interface RequerimientoPermiso {
  accion: Accion;
  recurso: Recurso;
}

/** Requiere el permiso (accion + recurso) para acceder a la ruta. */
export const RequirePermiso = (accion: Accion, recurso: Recurso) =>
  SetMetadata(PERMISOS_KEY, [{ accion, recurso }] as RequerimientoPermiso[]);
