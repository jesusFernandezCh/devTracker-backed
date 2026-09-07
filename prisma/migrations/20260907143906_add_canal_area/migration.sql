-- AlterTable
ALTER TABLE "proyectos" ADD COLUMN     "canalAreaId" TEXT;

-- CreateTable
CREATE TABLE "canal_areas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "canal_areas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "canal_areas_nombre_key" ON "canal_areas"("nombre");

-- AddForeignKey
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_canalAreaId_fkey" FOREIGN KEY ("canalAreaId") REFERENCES "canal_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
