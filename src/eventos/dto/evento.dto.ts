import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CrearEventoDto {
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsNotEmpty()
  fechaInicio: Date | string;

  @IsNotEmpty()
  fechaFin: Date | string;

  @IsOptional()
  @IsBoolean()
  todoElDia?: boolean;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsString()
  color?: string;
}

export class ActualizarEventoDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  titulo?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  fechaInicio?: Date | string;

  @IsOptional()
  fechaFin?: Date | string;

  @IsOptional()
  @IsBoolean()
  todoElDia?: boolean;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsString()
  color?: string;
}
