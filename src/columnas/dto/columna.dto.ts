import { ArrayUnique, IsArray, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CrearColumnaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  nombre: string;

  @IsOptional()
  @IsString()
  color?: string;
}

export class ActualizarColumnaDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  nombre?: string;

  @IsOptional()
  @IsString()
  color?: string;
}

export class ReordenarColumnasDto {
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  ids: string[];
}
