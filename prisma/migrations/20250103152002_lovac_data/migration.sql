/*
  Warnings:

  - You are about to drop the column `b2_evol_demographique` on the `scenarios` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "scenarios" DROP COLUMN "b2_evol_demographique",
ADD COLUMN     "b2_tx_vacance_longue" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- CreateTable
CREATE TABLE "vacancy_accommodation" (
    "nb_total_pp" INTEGER NOT NULL,
    "nb_loc_vac_pp" INTEGER NOT NULL,
    "nb_loc_vac_pp_short" INTEGER NOT NULL,
    "nb_loc_vac_pp_long" INTEGER NOT NULL,
    "prop_loc_vac_pp" DOUBLE PRECISION NOT NULL,
    "prop_loc_vac_pp_short" DOUBLE PRECISION NOT NULL,
    "prop_loc_vac_pp_long" DOUBLE PRECISION NOT NULL,
    "epci_code" TEXT NOT NULL,

    CONSTRAINT "vacancy_accommodation_pkey" PRIMARY KEY ("epci_code")
);

-- AddForeignKey
ALTER TABLE "vacancy_accommodation" ADD CONSTRAINT "vacancy_accommodation_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
