/*
  Warnings:

  - You are about to drop the column `b2_scenario_omphale` on the `scenarios` table. All the data in the column will be lost.
  - The `b11_etablissement` column on the `scenarios` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `b15_surocc` column on the `scenarios` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `b11_sa` on table `scenarios` required. This step will fail if there are existing NULL values in that column.
  - Made the column `b11_fortune` on table `scenarios` required. This step will fail if there are existing NULL values in that column.
  - Made the column `b11_hotel` on table `scenarios` required. This step will fail if there are existing NULL values in that column.
  - Made the column `source_b11` on table `scenarios` required. This step will fail if there are existing NULL values in that column.
  - Made the column `b11_part_etablissement` on table `scenarios` required. This step will fail if there are existing NULL values in that column.
  - Made the column `b12_cohab_interg_subie` on table `scenarios` required. This step will fail if there are existing NULL values in that column.
  - Made the column `b12_heberg_particulier` on table `scenarios` required. This step will fail if there are existing NULL values in that column.
  - Made the column `b12_heberg_gratuit` on table `scenarios` required. This step will fail if there are existing NULL values in that column.
  - Made the column `b12_heberg_temporaire` on table `scenarios` required. This step will fail if there are existing NULL values in that column.
  - Made the column `b13_acc` on table `scenarios` required. This step will fail if there are existing NULL values in that column.
  - Made the column `b13_plp` on table `scenarios` required. This step will fail if there are existing NULL values in that column.
  - Made the column `b13_taux_effort` on table `scenarios` required. This step will fail if there are existing NULL values in that column.
  - Made the column `b13_taux_reallocation` on table `scenarios` required. This step will fail if there are existing NULL values in that column.
  - Made the column `b14_confort` on table `scenarios` required. This step will fail if there are existing NULL values in that column.
  - Made the column `b14_occupation` on table `scenarios` required. This step will fail if there are existing NULL values in that column.
  - Made the column `source_b14` on table `scenarios` required. This step will fail if there are existing NULL values in that column.
  - Made the column `b14_taux_reallocation` on table `scenarios` required. This step will fail if there are existing NULL values in that column.
  - Made the column `b15_proprietaire` on table `scenarios` required. This step will fail if there are existing NULL values in that column.
  - Made the column `b15_loc_hors_hlm` on table `scenarios` required. This step will fail if there are existing NULL values in that column.
  - Made the column `source_b15` on table `scenarios` required. This step will fail if there are existing NULL values in that column.
  - Made the column `b15_taux_reallocation` on table `scenarios` required. This step will fail if there are existing NULL values in that column.
  - Made the column `b17_motif` on table `scenarios` required. This step will fail if there are existing NULL values in that column.
  - Made the column `b2_tx_restructuration` on table `scenarios` required. This step will fail if there are existing NULL values in that column.
  - Made the column `b2_tx_disparition` on table `scenarios` required. This step will fail if there are existing NULL values in that column.
  - Made the column `b2_tx_vacance` on table `scenarios` required. This step will fail if there are existing NULL values in that column.
  - Made the column `b2_tx_rs` on table `scenarios` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "B15Surocc" AS ENUM ('Acc', 'Mod');

-- CreateEnum
CREATE TYPE "B11Etablissement" AS ENUM ('autreCentre', 'demandeAsile', 'reinsertion', 'centreProvisoire', 'jeuneTravailleur', 'foyerMigrants', 'malade', 'maisonRelai', 'horsMaisonRelai');

-- AlterTable
ALTER TABLE "scenarios" DROP COLUMN "b2_scenario_omphale",
ADD COLUMN     "b2_evol_demographique" INTEGER,
ADD COLUMN     "b2_scenario" TEXT,
ALTER COLUMN "b11_sa" SET NOT NULL,
ALTER COLUMN "b11_sa" SET DEFAULT true,
ALTER COLUMN "b11_fortune" SET NOT NULL,
ALTER COLUMN "b11_fortune" SET DEFAULT true,
ALTER COLUMN "b11_hotel" SET NOT NULL,
ALTER COLUMN "b11_hotel" SET DEFAULT true,
ALTER COLUMN "source_b11" SET NOT NULL,
ALTER COLUMN "source_b11" SET DEFAULT 'RP',
DROP COLUMN "b11_etablissement",
ADD COLUMN     "b11_etablissement" "B11Etablissement"[] DEFAULT ARRAY['autreCentre', 'demandeAsile', 'reinsertion', 'centreProvisoire', 'jeuneTravailleur', 'foyerMigrants', 'malade', 'maisonRelai', 'horsMaisonRelai']::"B11Etablissement"[],
ALTER COLUMN "b11_part_etablissement" SET NOT NULL,
ALTER COLUMN "b11_part_etablissement" SET DEFAULT 100,
ALTER COLUMN "b12_cohab_interg_subie" SET NOT NULL,
ALTER COLUMN "b12_cohab_interg_subie" SET DEFAULT 50,
ALTER COLUMN "b12_heberg_particulier" SET NOT NULL,
ALTER COLUMN "b12_heberg_particulier" SET DEFAULT true,
ALTER COLUMN "b12_heberg_gratuit" SET NOT NULL,
ALTER COLUMN "b12_heberg_gratuit" SET DEFAULT true,
ALTER COLUMN "b12_heberg_temporaire" SET NOT NULL,
ALTER COLUMN "b12_heberg_temporaire" SET DEFAULT true,
ALTER COLUMN "b13_acc" SET NOT NULL,
ALTER COLUMN "b13_acc" SET DEFAULT true,
ALTER COLUMN "b13_plp" SET NOT NULL,
ALTER COLUMN "b13_plp" SET DEFAULT true,
ALTER COLUMN "b13_taux_effort" SET NOT NULL,
ALTER COLUMN "b13_taux_effort" SET DEFAULT 30,
ALTER COLUMN "b13_taux_reallocation" SET NOT NULL,
ALTER COLUMN "b13_taux_reallocation" SET DEFAULT 80,
ALTER COLUMN "b14_confort" SET NOT NULL,
ALTER COLUMN "b14_confort" SET DEFAULT 'RP_abs_sani',
ALTER COLUMN "b14_occupation" SET NOT NULL,
ALTER COLUMN "b14_occupation" SET DEFAULT 'prop_loc',
ALTER COLUMN "source_b14" SET NOT NULL,
ALTER COLUMN "source_b14" SET DEFAULT 'RP',
ALTER COLUMN "b14_taux_reallocation" SET NOT NULL,
ALTER COLUMN "b14_taux_reallocation" SET DEFAULT 80,
DROP COLUMN "b15_surocc",
ADD COLUMN     "b15_surocc" "B15Surocc" NOT NULL DEFAULT 'Acc',
ALTER COLUMN "b15_proprietaire" SET NOT NULL,
ALTER COLUMN "b15_proprietaire" SET DEFAULT false,
ALTER COLUMN "b15_loc_hors_hlm" SET NOT NULL,
ALTER COLUMN "b15_loc_hors_hlm" SET DEFAULT true,
ALTER COLUMN "source_b15" SET NOT NULL,
ALTER COLUMN "source_b15" SET DEFAULT 'RP',
ALTER COLUMN "b15_taux_reallocation" SET NOT NULL,
ALTER COLUMN "b15_taux_reallocation" SET DEFAULT 80,
ALTER COLUMN "b17_motif" SET NOT NULL,
ALTER COLUMN "b17_motif" SET DEFAULT 'Tout',
ALTER COLUMN "b2_tx_restructuration" SET NOT NULL,
ALTER COLUMN "b2_tx_restructuration" SET DEFAULT 0.0,
ALTER COLUMN "b2_tx_restructuration" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "b2_tx_disparition" SET NOT NULL,
ALTER COLUMN "b2_tx_disparition" SET DEFAULT 0.0,
ALTER COLUMN "b2_tx_disparition" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "b2_tx_vacance" SET NOT NULL,
ALTER COLUMN "b2_tx_vacance" SET DEFAULT 0.0,
ALTER COLUMN "b2_tx_vacance" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "b2_tx_rs" SET NOT NULL,
ALTER COLUMN "b2_tx_rs" SET DEFAULT 0.0,
ALTER COLUMN "b2_tx_rs" SET DATA TYPE DOUBLE PRECISION;
