/*
  Warnings:

  - The primary key for the `vacancy_accommodation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `nb_loc_vac_pp` on the `vacancy_accommodation` table. All the data in the column will be lost.
  - You are about to drop the column `nb_loc_vac_pp_long` on the `vacancy_accommodation` table. All the data in the column will be lost.
  - You are about to drop the column `nb_loc_vac_pp_short` on the `vacancy_accommodation` table. All the data in the column will be lost.
  - You are about to drop the column `nb_total_pp` on the `vacancy_accommodation` table. All the data in the column will be lost.
  - You are about to drop the column `prop_loc_vac_pp` on the `vacancy_accommodation` table. All the data in the column will be lost.
  - You are about to drop the column `prop_loc_vac_pp_long` on the `vacancy_accommodation` table. All the data in the column will be lost.
  - You are about to drop the column `prop_loc_vac_pp_short` on the `vacancy_accommodation` table. All the data in the column will be lost.
  - Added the required column `nb_log_vac_2less` to the `vacancy_accommodation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nb_log_vac_2more` to the `vacancy_accommodation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nb_log_vac_5more` to the `vacancy_accommodation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nb_total` to the `vacancy_accommodation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prop_log_vac_2less` to the `vacancy_accommodation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prop_log_vac_2more` to the `vacancy_accommodation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prop_log_vac_5more` to the `vacancy_accommodation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year` to the `vacancy_accommodation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "vacancy_accommodation" DROP CONSTRAINT "vacancy_accommodation_pkey",
DROP COLUMN "nb_loc_vac_pp",
DROP COLUMN "nb_loc_vac_pp_long",
DROP COLUMN "nb_loc_vac_pp_short",
DROP COLUMN "nb_total_pp",
DROP COLUMN "prop_loc_vac_pp",
DROP COLUMN "prop_loc_vac_pp_long",
DROP COLUMN "prop_loc_vac_pp_short",
ADD COLUMN     "nb_log_vac_2less" INTEGER NOT NULL,
ADD COLUMN     "nb_log_vac_2more" INTEGER NOT NULL,
ADD COLUMN     "nb_log_vac_5more" INTEGER NOT NULL,
ADD COLUMN     "nb_total" INTEGER NOT NULL,
ADD COLUMN     "prop_log_vac_2less" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "prop_log_vac_2more" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "prop_log_vac_5more" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "year" INTEGER NOT NULL,
ADD CONSTRAINT "vacancy_accommodation_pkey" PRIMARY KEY ("epci_code", "year");
