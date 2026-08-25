import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  ActualizarColumnaDto,
  CrearColumnaDto,
  ReordenarColumnasDto,
} from './dto/columna.dto';
import { COLORES_PALETA } from '../common/default-permisos';

@Injectable()
export class ColumnasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.columna.findMany({
      orderBy: { orden: 'asc' },
    });
  }

  async crear(dto: CrearColumnaDto) {
    const total = await this.prisma.columna.count();
    const orden = total;
    const color =
      dto.color ?? COLORES_PALETA[total % COLORES_PALETA.length];
    return this.prisma.columna.create({
      data: { id: randomUUID(), nombre: dto.nombre, orden, color },
    });
  }

  async actualizar(id: string, dto: ActualizarColumnaDto) {
    await this.existe(id);
    return this.prisma.columna.update({
      where: { id },
      data: {
        nombre: dto.nombre,
        color: dto.color,
      },
    });
  }

  async reordenar(dto: ReordenarColumnasDto) {
    await this.prisma.$transaction(
      dto.ids.map((id, index) =>
        this.prisma.columna.update({
          where: { id },
          data: { orden: index },
        }),
      ),
    );
    return this.findAll();
  }

  async eliminar(id: string) {
    const columna = await this.prisma.columna.findUnique({ where: { id } });
    if (!columna) throw new NotFoundException('Columna no encontrada');

    const proyectos = await this.prisma.proyecto.count({ where: { columnaId: id } });
    if (proyectos > 0) {
      throw new ConflictException(
        `No se puede eliminar: hay ${proyectos} proyecto(s) en esta columna`,
      );
    }

    await this.prisma.columna.delete({ where: { id } });

    // Reordenar las columnas restantes (orden contiguo).
    const restantes = await this.prisma.columna.findMany({
      orderBy: { orden: 'asc' },
    });
    for (const [index, c] of restantes.entries()) {
      if (c.orden !== index) {
        await this.prisma.columna.update({ where: { id: c.id }, data: { orden: index } });
      }
    }
  }

  private async existe(id: string) {
    const c = await this.prisma.columna.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Columna no encontrada');
  }
}
