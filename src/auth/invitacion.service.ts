import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';

const INVITACION_TTL_HORAS = 48;

@Injectable()
export class InvitacionService {
  private readonly logger = new Logger(InvitacionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async invitar(correo: string, rolId: string | undefined, invitadoPorId: string) {
    const usuario = await this.prisma.user.findUnique({
      where: { correo },
    });
    if (usuario) {
      throw new BadRequestException('El correo ya está registrado');
    }

    const existente = await this.prisma.invitacion.findUnique({
      where: { correo },
    });
    if (existente && !existente.usadoEn && existente.expiraEn.getTime() > Date.now()) {
      throw new BadRequestException('Ya existe una invitación pendiente para este correo');
    }

    const token = randomBytes(32).toString('hex');
    const expiraEn = new Date(Date.now() + INVITACION_TTL_HORAS * 60 * 60 * 1000);

    const invitacion = await this.prisma.invitacion.upsert({
      where: { correo },
      create: {
        correo,
        token,
        rolId,
        invitadoPor: invitadoPorId,
        expiraEn,
      },
      update: {
        token,
        rolId,
        invitadoPor: invitadoPorId,
        expiraEn,
        usadoEn: null,
      },
    });

    const invitador = await this.prisma.user.findUnique({
      where: { id: invitadoPorId },
    });
    const nombreInvitador = invitador?.usuario ?? 'Un administrador';

    await this.emailService.enviarInvitacion(correo, token, nombreInvitador);

    return {
      id: invitacion.id,
      correo: invitacion.correo,
      expiraEn: invitacion.expiraEn,
      createdAt: invitacion.createdAt,
    };
  }

  async verificarToken(token: string) {
    const invitacion = await this.prisma.invitacion.findUnique({
      where: { token },
    });
    if (!invitacion) {
      throw new NotFoundException('Invitación no válida');
    }
    if (invitacion.usadoEn) {
      throw new BadRequestException('Esta invitación ya fue utilizada');
    }
    if (invitacion.expiraEn.getTime() < Date.now()) {
      throw new BadRequestException('Esta invitación ha expirado');
    }

    return {
      correo: invitacion.correo,
      rolId: invitacion.rolId,
    };
  }

  async marcarUsado(token: string): Promise<void> {
    await this.prisma.invitacion.update({
      where: { token },
      data: { usadoEn: new Date() },
    });
  }
}
