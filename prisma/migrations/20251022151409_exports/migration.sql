-- CreateEnum
CREATE TYPE "ExportType" AS ENUM ('POWERPOINT', 'EXCEL');

-- CreateTable
CREATE TABLE "exports" (
    "id" TEXT NOT NULL,
    "simulation_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "ExportType" NOT NULL,

    CONSTRAINT "exports_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "exports" ADD CONSTRAINT "exports_simulation_id_fkey" FOREIGN KEY ("simulation_id") REFERENCES "simulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate exported simulations to exports table
INSERT INTO "exports" ("simulation_id", "type")
SELECT "id", 'POWERPOINT'
FROM "simulations"
WHERE "exported" = true;

-- AlterTable
ALTER TABLE "simulations" DROP COLUMN "exported";