import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { CanalChat } from '@prisma/client';

export class EnviarMensajeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  texto: string;
}

export class MarcarLeidosDto {
  @IsEnum(CanalChat)
  canal: CanalChat;

  @IsOptional()
  @IsString()
  destinoId?: string;

  @IsOptional()
  @IsString()
  proyectoId?: string;
}
