-- AlterTable
ALTER TABLE "scenarios" ALTER COLUMN "b1_horizon_resorption" SET DEFAULT 2050;

UPDATE "scenarios" SET "b1_horizon_resorption" = 2050 WHERE "b1_horizon_resorption" IS NULL;