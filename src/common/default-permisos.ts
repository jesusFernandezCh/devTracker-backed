import { Accion, Recurso } from '@prisma/client';
import { ROL_SUPER_ADMIN_ID } from '../constants';

export const RECURSOS_ORDEN: Recurso[] = [
  'tareas',
  'proyectos',
  'planning',
  'calendario',
  'tablero',
  'reportes',
  'usuarios',
  'roles',
];

export const ACCIONES: Accion[] = ['leer', 'crear', 'editar', 'eliminar'];

function todas(): Accion[] {
  return [...ACCIONES];
}

/** Matriz idéntica a PERMISOS de models/permiso.model.ts del frontend. */
export const MATRIZ_DEFAULT: Record<string, Partial<Record<Recurso, Accion[]>>> = {
  [ROL_SUPER_ADMIN_ID]: Object.fromEntries(RECURSOS_ORDEN.map((r) => [r, todas()])),
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
    usuarios: ['leer'],
    roles: [],
    planning: ['leer'],
    calendario: ['leer'],
    tablero: ['leer'],
    reportes: ['leer'],
  },
};

/** Colores de la paleta para nuevas columnas (mismo set que el frontend). */
export const COLORES_PALETA = [
  '#EAB308',
  '#3B82F6',
  '#22C55E',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#F97316',
  '#14B8A6',
];
