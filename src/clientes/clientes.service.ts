import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CrearClienteDto, ActualizarClienteDto } from './dto/cliente.dto';

@Injectable()
export class ClientesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.cliente.findMany({ orderBy: { nombre: 'asc' } });
  }

  async crear(dto: CrearClienteDto) {
    const existe = await this.prisma.cliente.findFirst({
      where: { nombre: { equals: dto.nombre, mode: 'insensitive' } },
    });
    if (existe) {
      throw new ConflictException(`Ya existe un cliente llamado «${dto.nombre}»`);
    }
    return this.prisma.cliente.create({
      data: { id: randomUUID(), nombre: dto.nombre },
    });
  }

  async actualizar(id: string, dto: ActualizarClienteDto) {
    await this.existe(id);
    const duplicado = await this.prisma.cliente.findFirst({
      where: {
        nombre: { equals: dto.nombre, mode: 'insensitive' },
        id: { not: id },
      },
    });
    if (duplicado) {
      throw new ConflictException(`Ya existe un cliente llamado «${dto.nombre}»`);
    }

    // Renombrar en todos los proyectos que referencian el nombre anterior.
    const actual = await this.prisma.cliente.findUnique({ where: { id } });
    if (actual && actual.nombre !== dto.nombre) {
      await this.prisma.proyecto.updateMany({
        where: { cliente: actual.nombre },
        data: { cliente: dto.nombre },
      });
    }

    return this.prisma.cliente.update({
      where: { id },
      data: { nombre: dto.nombre },
    });
  }

  async eliminar(id: string) {
    const cliente = await this.prisma.cliente.findUnique({ where: { id } });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');

    const enUso = await this.prisma.proyecto.count({
      where: { cliente: cliente.nombre },
    });
    if (enUso > 0) {
      throw new ConflictException(
        `No se puede eliminar: hay ${enUso} proyecto(s) que referencian este cliente`,
      );
    }

    await this.prisma.cliente.delete({ where: { id } });
  }

  private async existe(id: string) {
    const c = await this.prisma.cliente.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Cliente no encontrado');
  }
}
