-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "provider" TEXT,
ADD COLUMN     "providerId" TEXT,
ALTER COLUMN "claveHash" DROP NOT NULL;
