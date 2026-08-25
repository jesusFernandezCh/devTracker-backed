import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { TipoNotificacion } from '@prisma/client';

export class CrearNotificacionDto {
  @IsEnum(TipoNotificacion)
  tipo: TipoNotificacion;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  descripcion: string;

  @IsOptional()
  @IsString()
  url?: string;
}
