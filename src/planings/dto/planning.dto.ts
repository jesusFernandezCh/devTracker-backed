import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Complejidad } from '@prisma/client';

export class TareaDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  tarea: string;

  @IsEnum(Complejidad)
  complejidad: Complejidad;

  @IsOptional()
  @IsBoolean()
  completada?: boolean;
}

export class CrearPlanningDto {
  @IsString()
  @IsNotEmpty()
  fecha: string;

  @IsString()
  @IsNotEmpty()
  proyectoId: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  tareas?: TareaDto[];
}

export class ActualizarPlanningDto {
  @IsOptional()
  @IsString()
  fecha?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  tareas?: TareaDto[];
}

export class ClonarPlanningDto {
  @IsOptional()
  @IsString()
  fecha?: string;
}
