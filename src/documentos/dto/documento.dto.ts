import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CrearDocumentoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsString()
  @IsNotEmpty()
  archivoBase64: string;

  @IsString()
  @IsNotEmpty()
  tipoMime: string;

  @IsString()
  @IsNotEmpty()
  proyectoId: string;
}

export class ActualizarDocumentoDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  archivoBase64?: string;

  @IsOptional()
  @IsString()
  tipoMime?: string;
}
