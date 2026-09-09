-- AlterTable
ALTER TABLE "planning_tareas" ADD COLUMN "usuarioId" TEXT;

-- AddForeignKey
ALTER TABLE "planning_tareas" ADD CONSTRAINT "planning_tareas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
