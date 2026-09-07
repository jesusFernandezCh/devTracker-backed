import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SocialLoginDto {
  @IsIn(['google', 'facebook'])
  provider: 'google' | 'facebook';

  @IsString()
  @IsNotEmpty()
  providerId: string;

  @IsEmail()
  correo: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  usuario: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  foto?: string;
}
