-- CreateEnum
CREATE TYPE "EstatusUsuario" AS ENUM ('pendiente', 'activo', 'suspendido');

-- AlterTable: Add estatus, proveedor, usuarioExternoId to usuarios
ALTER TABLE "usuarios" ADD COLUMN "estatus" "EstatusUsuario" NOT NULL DEFAULT 'activo';
ALTER TABLE "usuarios" ADD COLUMN "proveedor" TEXT;
ALTER TABLE "usuarios" ADD COLUMN "usuarioExternoId" TEXT;

-- CreateTable
CREATE TABLE "invitaciones" (
    "id" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "rolId" TEXT,
    "invitadoPor" TEXT NOT NULL,
    "expiraEn" TIMESTAMP(3) NOT NULL,
    "usadoEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invitaciones_correo_key" ON "invitaciones"("correo");
CREATE UNIQUE INDEX "invitaciones_token_key" ON "invitaciones"("token");
