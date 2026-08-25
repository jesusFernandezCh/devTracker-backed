import { ArrayUnique, IsArray, IsString } from 'class-validator';

export class EstablecerEquipoDto {
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  usuarioIds: string[];
}
