/*
  Warnings:

  - You are about to drop the column `b2_tx_disparition` on the `scenarios` table. All the data in the column will be lost.
  - You are about to drop the column `b2_tx_restructuration` on the `scenarios` table. All the data in the column will be lost.
  - You are about to drop the column `b2_tx_rs` on the `scenarios` table. All the data in the column will be lost.
  - You are about to drop the column `b2_tx_vacance` on the `scenarios` table. All the data in the column will be lost.
  - You are about to drop the column `b2_tx_vacance_longue` on the `scenarios` table. All the data in the column will be lost.
  - You are about to drop the column `epci_code` on the `simulations` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "simulations" DROP CONSTRAINT "simulations_epci_code_fkey";

-- AlterTable
ALTER TABLE "epcis" ADD COLUMN     "bassin_name" TEXT;

-- AlterTable
ALTER TABLE "scenarios" DROP COLUMN "b2_tx_disparition",
DROP COLUMN "b2_tx_restructuration",
DROP COLUMN "b2_tx_rs",
DROP COLUMN "b2_tx_vacance",
DROP COLUMN "b2_tx_vacance_longue";

-- AlterTable
ALTER TABLE "simulations" DROP COLUMN "epci_code";

-- CreateTable
CREATE TABLE "bassin" (
    "name" TEXT NOT NULL,

    CONSTRAINT "bassin_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "epci_scenarios" (
    "b2_tx_restructuration" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "b2_tx_disparition" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "b2_tx_vacance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "b2_tx_rs" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "epci_code" TEXT NOT NULL,
    "scenario_id" TEXT NOT NULL,

    CONSTRAINT "epci_scenarios_pkey" PRIMARY KEY ("epci_code","scenario_id")
);

-- CreateTable
CREATE TABLE "_EpciToSimulation" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "bassin_name_key" ON "bassin"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_EpciToSimulation_AB_unique" ON "_EpciToSimulation"("A", "B");

-- CreateIndex
CREATE INDEX "_EpciToSimulation_B_index" ON "_EpciToSimulation"("B");

-- AddForeignKey
ALTER TABLE "epci_scenarios" ADD CONSTRAINT "epci_scenarios_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "epci_scenarios" ADD CONSTRAINT "epci_scenarios_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "epcis" ADD CONSTRAINT "epcis_bassin_name_fkey" FOREIGN KEY ("bassin_name") REFERENCES "bassin"("name") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EpciToSimulation" ADD CONSTRAINT "_EpciToSimulation_A_fkey" FOREIGN KEY ("A") REFERENCES "epcis"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EpciToSimulation" ADD CONSTRAINT "_EpciToSimulation_B_fkey" FOREIGN KEY ("B") REFERENCES "simulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
