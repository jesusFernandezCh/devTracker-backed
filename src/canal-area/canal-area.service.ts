import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CrearCanalAreaDto, ActualizarCanalAreaDto } from './dto/canal-area.dto';

@Injectable()
export class CanalAreaService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.canalArea.findMany({ orderBy: { nombre: 'asc' } });
  }

  async crear(dto: CrearCanalAreaDto) {
    const existe = await this.prisma.canalArea.findFirst({
      where: { nombre: { equals: dto.nombre, mode: 'insensitive' } },
    });
    if (existe) {
      throw new ConflictException(`Ya existe un canal/área llamado «${dto.nombre}»`);
    }
    return this.prisma.canalArea.create({
      data: { id: randomUUID(), nombre: dto.nombre },
    });
  }

  async actualizar(id: string, dto: ActualizarCanalAreaDto) {
    await this.existe(id);
    const duplicado = await this.prisma.canalArea.findFirst({
      where: {
        nombre: { equals: dto.nombre, mode: 'insensitive' },
        id: { not: id },
      },
    });
    if (duplicado) {
      throw new ConflictException(`Ya existe un canal/área llamado «${dto.nombre}»`);
    }

    return this.prisma.canalArea.update({
      where: { id },
      data: { nombre: dto.nombre },
    });
  }

  async eliminar(id: string) {
    const canal = await this.prisma.canalArea.findUnique({ where: { id } });
    if (!canal) throw new NotFoundException('Canal/Área no encontrado');

    const enUso = await this.prisma.proyecto.count({
      where: { canalAreaId: id },
    });
    if (enUso > 0) {
      throw new ConflictException(
        `No se puede eliminar: hay ${enUso} proyecto(s) que utilizan este canal/área`,
      );
    }

    await this.prisma.canalArea.delete({ where: { id } });
  }

  private async existe(id: string) {
    const c = await this.prisma.canalArea.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Canal/Área no encontrado');
  }
}
