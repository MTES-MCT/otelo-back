/*
  Warnings:

  - Made the column `b2_scenario` on table `scenarios` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "scenarios" ALTER COLUMN "source_b14" SET DEFAULT 'Filo',
ALTER COLUMN "source_b15" SET DEFAULT 'Filo',
ALTER COLUMN "b2_scenario" SET NOT NULL;
