import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Accion, Recurso } from '@prisma/client';
import { ACCIONES, RECURSOS_ORDEN } from '../../common/default-permisos';

export class CrearRolDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  nombre: string;
}

export class RenombrarRolDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  nombre: string;
}

export class TogglePermisoDto {
  @IsIn(RECURSOS_ORDEN)
  recurso: Recurso;

  @IsIn(ACCIONES)
  accion: Accion;
}
