import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CrearClienteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;
}

export class ActualizarClienteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;
}
