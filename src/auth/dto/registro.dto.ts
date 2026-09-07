import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegistroDto {
  @IsEmail()
  correo: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  usuario: string;

  @IsString()
  @MinLength(6)
  @MaxLength(200)
  clave: string;

  @IsString()
  @MinLength(6)
  @MaxLength(200)
  claveConfirmacion: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  token?: string;
}

export class VerificarEmailDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class InvitarUsuarioDto {
  @IsEmail()
  correo: string;

  @IsOptional()
  @IsString()
  rolId?: string;
}

export class AprobarUsuarioDto {
  @IsString()
  @IsNotEmpty()
  rolId: string;
}

export class RegistroOAuthDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsOptional()
  @IsString()
  state?: string;
}
