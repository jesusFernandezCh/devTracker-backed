import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter;
  private readonly frontendUrl: string;
  private readonly fromAddress: string;

  constructor(private readonly config: ConfigService) {
    this.frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:4200';
    this.fromAddress = this.config.get<string>('SMTP_FROM') ?? 'no-reply@devtracker.app';

    this.transporter = createTransport({
      host: this.config.get<string>('SMTP_HOST') ?? 'smtp.gmail.com',
      port: Number(this.config.get<string>('SMTP_PORT') ?? 587),
      secure: false,
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASS')?.replace(/\s/g, ''),
      },
    });
  }

  async enviarInvitacion(
    correo: string,
    token: string,
    nombreInvitador: string,
  ): Promise<void> {
    const enlace = `${this.frontendUrl}/registro?token=${token}&correo=${encodeURIComponent(correo)}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #4f46e5; font-size: 24px; margin: 0;">DevTracker</h1>
        </div>
        <h2 style="color: #1f2937; font-size: 18px; text-align: center;">Has sido invitado a unirte</h2>
        <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
          <strong>${nombreInvitador}</strong> te ha invitado a crear una cuenta en DevTracker.
        </p>
        <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
          Haz clic en el botón de abajo para completar tu registro:
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${enlace}"
             style="background-color: #0d9488; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 14px; font-weight: 600; display: inline-block;">
            Crear mi cuenta
          </a>
        </div>
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          Este enlace expira en 48 horas. Si no solicitaste esta invitación, puedes ignorar este mensaje.
        </p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: correo,
        subject: 'Invitación a DevTracker',
        html,
      });
      this.logger.log(`Correo de invitación enviado a ${correo}`);
    } catch (error) {
      this.logger.error(`Error enviando correo a ${correo}: ${error}`);
      throw error;
    }
  }

  async enviarBienvenida(correo: string, usuario: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #4f46e5; font-size: 24px; margin: 0;">DevTracker</h1>
        </div>
        <h2 style="color: #1f2937; font-size: 18px; text-align: center;">¡Tu cuenta ha sido activada!</h2>
        <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
          Hola <strong>${usuario}</strong>, tu cuenta ha sido aprobada por un administrador.
        </p>
        <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
          Ya puedes iniciar sesión y comenzar a usar DevTracker.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${this.frontendUrl}/login"
             style="background-color: #0d9488; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 14px; font-weight: 600; display: inline-block;">
            Iniciar sesión
          </a>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: correo,
        subject: 'Tu cuenta en DevTracker ha sido activada',
        html,
      });
      this.logger.log(`Correo de bienvenida enviado a ${correo}`);
    } catch (error) {
      this.logger.error(`Error enviando correo de bienvenida a ${correo}: ${error}`);
      throw error;
    }
  }
}
