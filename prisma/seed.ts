/**
 * Seed de DevTracker.
 *
 * Siembra el equivalente a los defaults del frontend:
 *  - Roles de sistema (ROLES_DEFAULT de models/permiso.model.ts)
 *  - Matriz de permisos (PERMISOS de models/permiso.model.ts)
 *  - Columnas del tablero (COLUMNAS_DEFAULT de models/columna.model.ts)
 *  - Usuario admin demo (USUARIOS_DEFAULT de models/usuario.model.ts)
 *
 * La clave del admin usa el formato legacy `salt:hash` (SHA-256) idéntico al
 * de `utils/cripto.ts` del frontend. En el primer login el backend la verifica
 * y la re-hashea a scrypt (upgrade silencioso).
 *
 * Idempotente: usa upsert por id.
 */

import { PrismaClient, Recurso, Accion } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';

const prisma = new PrismaClient();

const ACCIONES: Accion[] = ['leer', 'crear', 'editar', 'eliminar'];

const ROLES: Array<{ id: string; nombre: string; sistema: boolean }> = [
  { id: 'super-administrador', nombre: 'Super Administrador', sistema: true },
  { id: 'administrador', nombre: 'Administrador', sistema: true },
  { id: 'supervisor', nombre: 'Supervisor', sistema: true },
  { id: 'qa', nombre: 'QA', sistema: true },
  { id: 'usuario', nombre: 'Usuario', sistema: true },
];

const RECURSOS_ORDEN: Recurso[] = [
  'tareas',
  'proyectos',
  'planning',
  'calendario',
  'tablero',
  'reportes',
  'usuarios',
  'roles',
];

function todas(): Accion[] {
  return [...ACCIONES];
}

// Matriz idéntica a PERMISOS de models/permiso.model.ts.
const MATRIZ: Record<string, Partial<Record<Recurso, Accion[]>>> = {
  'super-administrador': Object.fromEntries(RECURSOS_ORDEN.map((r) => [r, todas()])),
  administrador: {
    tareas: todas(),
    proyectos: todas(),
    usuarios: todas(),
    roles: ['leer', 'editar', 'eliminar'],
    planning: todas(),
    calendario: todas(),
    tablero: todas(),
    reportes: todas(),
  },
  supervisor: {
    tareas: todas(),
    proyectos: todas(),
    usuarios: ['leer'],
    roles: ['leer'],
    planning: todas(),
    calendario: todas(),
    tablero: todas(),
    reportes: ['leer'],
  },
  qa: {
    tareas: todas(),
    proyectos: ['leer'],
    usuarios: ['leer'],
    roles: [],
    planning: ['leer'],
    calendario: ['leer'],
    tablero: ['leer'],
    reportes: ['leer'],
  },
  usuario: {
    tareas: todas(),
    proyectos: todas(),
    usuarios: ['leer', 'editar', 'eliminar'], 
    roles: todas(),
    planning: ['leer', 'editar', 'eliminar'], 
    calendario: todas(),
    tablero: todas(),
    reportes: todas(),
  },
};

const COLUMNAS = [
  { id: 'desarrollo', nombre: 'Desarrollo', orden: 0, color: '#EAB308' },
  { id: 'calidad', nombre: 'Calidad', orden: 1, color: '#3B82F6' },
  { id: 'produccion', nombre: 'Producción', orden: 2, color: '#22C55E' },
];

/** Hash legacy `salt:hash` (SHA-256), mismo formato que utils/cripto.ts. */
function hashLegacy(clave: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(`${salt}:${clave}`).digest('hex');
  return `${salt}:${hash}`;
}

async function main() {
  // ---- Roles ----
  for (const rol of ROLES) {
    await prisma.rol.upsert({
      where: { id: rol.id },
      create: rol,
      update: { nombre: rol.nombre, sistema: rol.sistema },
    });

    // Permisos del rol.
    const accionesPorRecurso = MATRIZ[rol.id] ?? {};
    await prisma.rolPermiso.deleteMany({ where: { rolId: rol.id } });
    const permisos: Array<{ rolId: string; recurso: Recurso; accion: Accion }> = [];
    for (const [recurso, acciones] of Object.entries(accionesPorRecurso)) {
      for (const accion of acciones) {
        permisos.push({ rolId: rol.id, recurso: recurso as Recurso, accion });
      }
    }
    if (permisos.length > 0) {
      await prisma.rolPermiso.createMany({ data: permisos });
    }
  }

  // ---- Columnas ----
  for (const col of COLUMNAS) {
    await prisma.columna.upsert({
      where: { id: col.id },
      create: col,
      update: col,
    });
  }

  // ---- Usuario admin demo ----
  const adminId = 'super-admin';
  const admin = {
    id: adminId,
    usuario: 'admin',
    correo: 'admin@email.com',
    claveHash: hashLegacy('admin123'),
    rolId: 'super-administrador',
  };
  await prisma.user.upsert({
    where: { id: adminId },
    create: admin,
    update: { ...admin, claveHash: admin.claveHash },
  });

  console.log('Seed completado: roles, permisos, columnas y admin listos.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
