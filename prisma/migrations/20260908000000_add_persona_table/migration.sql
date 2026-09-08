-- CreateTable
CREATE TABLE "personas" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "nombres" TEXT,
    "apellidos" TEXT,
    "cedula" TEXT,
    "telefono" TEXT,
    "telefonoContacto" TEXT,
    "direccion" TEXT,
    "foto" TEXT,
    "curriculum" JSONB,

    CONSTRAINT "personas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "personas_userId_key" ON "personas"("userId");

-- AddForeignKey
ALTER TABLE "personas" ADD CONSTRAINT "personas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- MigrateData: insertar personas desde datos existentes en usuarios
INSERT INTO "personas" ("id", "userId", "nombres", "apellidos", "cedula", "telefono", "telefonoContacto", "direccion", "foto", "curriculum")
SELECT gen_random_uuid(), "id", "nombres", "apellidos", "cedula", "telefono", "telefonoContacto", "direccion", "foto", "curriculum"
FROM "usuarios"
WHERE "nombres" IS NOT NULL OR "apellidos" IS NOT NULL OR "cedula" IS NOT NULL
   OR "telefono" IS NOT NULL OR "telefonoContacto" IS NOT NULL OR "direccion" IS NOT NULL
   OR "foto" IS NOT NULL OR "curriculum" IS NOT NULL;

-- DropColumns: eliminar campos de perfil de usuarios
ALTER TABLE "usuarios" DROP COLUMN "nombres";
ALTER TABLE "usuarios" DROP COLUMN "apellidos";
ALTER TABLE "usuarios" DROP COLUMN "cedula";
ALTER TABLE "usuarios" DROP COLUMN "telefono";
ALTER TABLE "usuarios" DROP COLUMN "telefonoContacto";
ALTER TABLE "usuarios" DROP COLUMN "direccion";
ALTER TABLE "usuarios" DROP COLUMN "foto";
ALTER TABLE "usuarios" DROP COLUMN "curriculum";
