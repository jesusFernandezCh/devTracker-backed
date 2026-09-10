-- CreateTable (idempotent — puede ya existir por prisma db push previo)
CREATE TABLE IF NOT EXISTS "eventos_calendario" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "todoElDia" BOOLEAN NOT NULL DEFAULT true,
    "categoria" TEXT NOT NULL DEFAULT 'general',
    "color" TEXT DEFAULT '#6366F1',
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eventos_calendario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "eventos_calendario_usuarioId_idx" ON "eventos_calendario"("usuarioId");

-- AddForeignKey (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'eventos_calendario_usuarioId_fkey'
    ) THEN
        ALTER TABLE "eventos_calendario" ADD CONSTRAINT "eventos_calendario_usuarioId_fkey"
            FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
