import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CrearDocumentoDto, ActualizarDocumentoDto } from './dto/documento.dto';

@Injectable()
export class DocumentosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(proyectoId?: string) {
    return this.prisma.documento.findMany({
      where: proyectoId ? { proyectoId } : undefined,
      orderBy: { fechaCreacion: 'desc' },
    });
  }

  async findOne(id: string) {
    const doc = await this.prisma.documento.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Documento no encontrado');
    return doc;
  }

  async crear(dto: CrearDocumentoDto, autorId: string) {
    return this.prisma.documento.create({
      data: {
        id: randomUUID(),
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        archivoBase64: dto.archivoBase64,
        tipoMime: dto.tipoMime,
        proyectoId: dto.proyectoId,
        autorId,
      },
    });
  }

  async actualizar(id: string, dto: ActualizarDocumentoDto) {
    await this.findOne(id);
    return this.prisma.documento.update({
      where: { id },
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        archivoBase64: dto.archivoBase64,
        tipoMime: dto.tipoMime,
        fechaModificacion: new Date(),
      },
    });
  }

  async eliminar(id: string) {
    await this.findOne(id);
    await this.prisma.documento.delete({ where: { id } });
  }
}
