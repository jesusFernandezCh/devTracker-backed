import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CrearCanalAreaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;
}

export class ActualizarCanalAreaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;
}
