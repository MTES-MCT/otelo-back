-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "SourceB11" AS ENUM ('RP', 'SNE');

-- CreateEnum
CREATE TYPE "SourceB14" AS ENUM ('RP', 'Filo', 'FF');

-- CreateEnum
CREATE TYPE "SourceB15" AS ENUM ('RP', 'Filo');

-- CreateEnum
CREATE TYPE "MotifB17" AS ENUM ('Tout', 'Env', 'Assis', 'Rappr', 'Trois');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstname" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "sub" TEXT,
    "provider" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("provider","providerAccountId")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenarios" (
    "id" TEXT NOT NULL,
    "isConfidential" BOOLEAN NOT NULL DEFAULT true,
    "projection" INTEGER NOT NULL,
    "b1_horizon_resorption" INTEGER NOT NULL DEFAULT 20,
    "b11_sa" BOOLEAN,
    "b11_fortune" BOOLEAN,
    "b11_hotel" BOOLEAN,
    "source_b11" "SourceB11",
    "b11_etablissement" TEXT[],
    "b11_part_etablissement" INTEGER,
    "b12_cohab_interg_subie" INTEGER,
    "b12_heberg_particulier" BOOLEAN,
    "b12_heberg_gratuit" BOOLEAN,
    "b12_heberg_temporaire" BOOLEAN,
    "b13_acc" BOOLEAN,
    "b13_plp" BOOLEAN,
    "b13_taux_effort" INTEGER,
    "b13_taux_reallocation" INTEGER,
    "b14_confort" TEXT,
    "b14_occupation" TEXT,
    "b14_qualite" TEXT,
    "source_b14" "SourceB14",
    "b14_taux_reallocation" INTEGER,
    "b15_surocc" TEXT,
    "b15_proprietaire" BOOLEAN,
    "b15_loc_hors_hlm" BOOLEAN,
    "source_b15" "SourceB15",
    "b15_taux_reallocation" INTEGER,
    "b17_motif" "MotifB17",
    "b2_scenario_omphale" TEXT,
    "b2_tx_restructuration" INTEGER,
    "b2_tx_disparition" INTEGER,
    "b2_tx_vacance" INTEGER,
    "b2_tx_rs" INTEGER,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "epcis" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,

    CONSTRAINT "epcis_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "simulations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,
    "epci_code" TEXT NOT NULL,
    "scenario_id" TEXT NOT NULL,

    CONSTRAINT "simulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demographic_evolution_omphale" (
    "year" INTEGER NOT NULL,
    "central_b" DOUBLE PRECISION NOT NULL,
    "central_c" DOUBLE PRECISION NOT NULL,
    "central_h" DOUBLE PRECISION NOT NULL,
    "ph_b" DOUBLE PRECISION NOT NULL,
    "ph_c" DOUBLE PRECISION NOT NULL,
    "ph_h" DOUBLE PRECISION NOT NULL,
    "pb_b" DOUBLE PRECISION NOT NULL,
    "pb_c" DOUBLE PRECISION NOT NULL,
    "pb_h" DOUBLE PRECISION NOT NULL,
    "epci_code" TEXT NOT NULL,

    CONSTRAINT "demographic_evolution_omphale_pkey" PRIMARY KEY ("epci_code","year")
);

-- CreateTable
CREATE TABLE "demographic_evolution_population" (
    "year" INTEGER NOT NULL,
    "central" DOUBLE PRECISION NOT NULL,
    "haute" DOUBLE PRECISION NOT NULL,
    "basse" DOUBLE PRECISION NOT NULL,
    "epci_code" TEXT NOT NULL,

    CONSTRAINT "demographic_evolution_population_pkey" PRIMARY KEY ("epci_code","year")
);

-- CreateTable
CREATE TABLE "physical_inadequation_filo" (
    "surocc_leg" INTEGER NOT NULL,
    "surocc_leg_po" INTEGER NOT NULL,
    "surocc_leg_lp" INTEGER NOT NULL,
    "surocc_leg_lh" INTEGER NOT NULL,
    "surocc_leg_au" INTEGER NOT NULL,
    "surocc_lourde" INTEGER NOT NULL,
    "surocc_lourde_po" INTEGER NOT NULL,
    "surocc_lourde_lp" INTEGER NOT NULL,
    "surocc_lourde_lh" INTEGER NOT NULL,
    "surocc_lourde_au" INTEGER NOT NULL,
    "epci_code" TEXT NOT NULL,

    CONSTRAINT "physical_inadequation_filo_pkey" PRIMARY KEY ("epci_code")
);

-- CreateTable
CREATE TABLE "physical_inadequation_rp" (
    "nb_men_acc_loc_hlm" DOUBLE PRECISION NOT NULL,
    "nb_men_acc_loc_meuble" DOUBLE PRECISION NOT NULL,
    "nb_men_acc_loc_non_hlm" DOUBLE PRECISION NOT NULL,
    "nb_men_acc_loge_gratuit" DOUBLE PRECISION NOT NULL,
    "nb_men_acc_ppt" DOUBLE PRECISION NOT NULL,
    "nb_men_mod_loc_hlm" DOUBLE PRECISION NOT NULL,
    "nb_men_mod_loc_meuble" DOUBLE PRECISION NOT NULL,
    "nb_men_mod_loc_non_hlm" DOUBLE PRECISION NOT NULL,
    "nb_men_mod_loge_gratuit" DOUBLE PRECISION NOT NULL,
    "nb_men_mod_ppt" DOUBLE PRECISION NOT NULL,
    "nb_men_norm_loc_hlm" DOUBLE PRECISION NOT NULL,
    "nb_men_norm_loc_meuble" DOUBLE PRECISION NOT NULL,
    "nb_men_norm_loc_non_hlm" DOUBLE PRECISION NOT NULL,
    "nb_men_norm_loge_gratuit" DOUBLE PRECISION NOT NULL,
    "nb_men_norm_ppt" DOUBLE PRECISION NOT NULL,
    "nb_men_studio_loc_hlm" DOUBLE PRECISION NOT NULL,
    "nb_men_studio_loc_meuble" DOUBLE PRECISION NOT NULL,
    "nb_men_studio_loc_non_hlm" DOUBLE PRECISION NOT NULL,
    "nb_men_studio_loge_gratuit" DOUBLE PRECISION NOT NULL,
    "nb_men_studio_ppt" DOUBLE PRECISION NOT NULL,
    "epci_code" TEXT NOT NULL,

    CONSTRAINT "physical_inadequation_rp_pkey" PRIMARY KEY ("epci_code")
);

-- CreateTable
CREATE TABLE "financial_inadequation" (
    "nb_all_plus20_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus21_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus22_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus23_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus24_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus25_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus26_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus27_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus28_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus29_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus30_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus31_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus32_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus33_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus34_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus35_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus36_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus37_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus38_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus39_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus40_parc_locatif_prive" DOUBLE PRECISION NOT NULL,
    "nb_all_plus20_accession_propriete" DOUBLE PRECISION NOT NULL,
    "nb_all_plus21_accession_propriete" DOUBLE PRECISION NOT NULL,
    "nb_all_plus22_accession_propriete" DOUBLE PRECISION NOT NULL,
    "nb_all_plus23_accession_propriete" DOUBLE PRECISION NOT NULL,
    "nb_all_plus24_accession_propriete" DOUBLE PRECISION NOT NULL,
    "nb_all_plus25_accession_propriete" DOUBLE PRECISION NOT NULL,
    "nb_all_plus26_accession_propriete" DOUBLE PRECISION NOT NULL,
    "nb_all_plus27_accession_propriete" DOUBLE PRECISION NOT NULL,
    "nb_all_plus28_accession_propriete" DOUBLE PRECISION NOT NULL,
    "nb_all_plus29_accession_propriete" DOUBLE PRECISION NOT NULL,
    "nb_all_plus30_accession_propriete" DOUBLE PRECISION NOT NULL,
    "nb_all_plus31_accession_propriete" DOUBLE PRECISION NOT NULL,
    "nb_all_plus32_accession_propriete" DOUBLE PRECISION NOT NULL,
    "nb_all_plus33_accession_propriete" DOUBLE PRECISION NOT NULL,
    "nb_all_plus34_accession_propriete" DOUBLE PRECISION NOT NULL,
    "nb_all_plus35_accession_propriete" DOUBLE PRECISION NOT NULL,
    "nb_all_plus36_accession_propriete" DOUBLE PRECISION NOT NULL,
    "nb_all_plus37_accession_propriete" DOUBLE PRECISION NOT NULL,
    "nb_all_plus38_accession_propriete" DOUBLE PRECISION NOT NULL,
    "nb_all_plus39_accession_propriete" DOUBLE PRECISION NOT NULL,
    "nb_all_plus40_accession_propriete" DOUBLE PRECISION NOT NULL,
    "epci_code" TEXT NOT NULL,

    CONSTRAINT "financial_inadequation_pkey" PRIMARY KEY ("epci_code")
);

-- CreateTable
CREATE TABLE "hosted_filocom" (
    "value" INTEGER NOT NULL,
    "epci_code" TEXT NOT NULL,

    CONSTRAINT "hosted_filocom_pkey" PRIMARY KEY ("epci_code")
);

-- CreateTable
CREATE TABLE "hosted_finess" (
    "autre_centre" INTEGER NOT NULL,
    "demande_asile" INTEGER NOT NULL,
    "reinsertion" INTEGER NOT NULL,
    "centre_provisoire" INTEGER NOT NULL,
    "jeune_travailleur" INTEGER NOT NULL,
    "foyer_migrants" INTEGER NOT NULL,
    "malade" INTEGER NOT NULL,
    "maison_relai" INTEGER NOT NULL,
    "hors_maison_relai" INTEGER NOT NULL,
    "epci_code" TEXT NOT NULL,

    CONSTRAINT "hosted_finess_pkey" PRIMARY KEY ("epci_code")
);

-- CreateTable
CREATE TABLE "hosted_sne" (
    "particular" INTEGER NOT NULL,
    "free" INTEGER NOT NULL,
    "temporary" INTEGER NOT NULL,
    "epci_code" TEXT NOT NULL,

    CONSTRAINT "hosted_sne_pkey" PRIMARY KEY ("epci_code")
);

-- CreateTable
CREATE TABLE "social_parc" (
    "crea" INTEGER NOT NULL,
    "voisin" INTEGER NOT NULL,
    "mater" INTEGER NOT NULL,
    "services" INTEGER NOT NULL,
    "motifs" INTEGER NOT NULL,
    "epci_code" TEXT NOT NULL,

    CONSTRAINT "social_parc_pkey" PRIMARY KEY ("epci_code")
);

-- CreateTable
CREATE TABLE "hotel" (
    "rp" INTEGER NOT NULL,
    "sne" INTEGER NOT NULL,
    "epci_code" TEXT NOT NULL,

    CONSTRAINT "hotel_pkey" PRIMARY KEY ("epci_code")
);

-- CreateTable
CREATE TABLE "makeshift_housing_rp" (
    "value" DOUBLE PRECISION NOT NULL,
    "epci_code" TEXT NOT NULL,

    CONSTRAINT "makeshift_housing_rp_pkey" PRIMARY KEY ("epci_code")
);

-- CreateTable
CREATE TABLE "makeshift_housing_sne" (
    "camping" INTEGER NOT NULL,
    "squat" INTEGER NOT NULL,
    "epci_code" TEXT NOT NULL,

    CONSTRAINT "makeshift_housing_sne_pkey" PRIMARY KEY ("epci_code")
);

-- CreateTable
CREATE TABLE "homeless" (
    "rp" DOUBLE PRECISION NOT NULL,
    "sne" DOUBLE PRECISION NOT NULL,
    "epci_code" TEXT NOT NULL,

    CONSTRAINT "homeless_pkey" PRIMARY KEY ("epci_code")
);

-- CreateTable
CREATE TABLE "bad_quality_filocom" (
    "pppi_lp" INTEGER NOT NULL,
    "pppi_po" INTEGER NOT NULL,
    "epci_code" TEXT NOT NULL,

    CONSTRAINT "bad_quality_filocom_pkey" PRIMARY KEY ("epci_code")
);

-- CreateTable
CREATE TABLE "bad_quality_rp" (
    "sani_loc_nonhlm" INTEGER NOT NULL,
    "sani_ppt" INTEGER NOT NULL,
    "sani_chfl_loc_nonhlm" INTEGER NOT NULL,
    "sani_chfl_ppt" INTEGER NOT NULL,
    "epci_code" TEXT NOT NULL,

    CONSTRAINT "bad_quality_rp_pkey" PRIMARY KEY ("epci_code")
);

-- CreateTable
CREATE TABLE "bad_quality_fonciers" (
    "pp_ss_wc_loc" INTEGER NOT NULL,
    "pp_ss_wc_ppt" INTEGER NOT NULL,
    "pp_ss_wc_au" INTEGER NOT NULL,
    "pp_ss_chauff_loc" INTEGER NOT NULL,
    "pp_ss_chauff_ppt" INTEGER NOT NULL,
    "pp_ss_chauff_au" INTEGER NOT NULL,
    "pp_ss_sdb_loc" INTEGER NOT NULL,
    "pp_ss_sdb_ppt" INTEGER NOT NULL,
    "pp_ss_sdb_au" INTEGER NOT NULL,
    "pp_ss_wc_chauff_loc" INTEGER NOT NULL,
    "pp_ss_wc_chauff_ppt" INTEGER NOT NULL,
    "pp_ss_wc_chauff_au" INTEGER NOT NULL,
    "pp_ss_wc_sdb_loc" INTEGER NOT NULL,
    "pp_ss_wc_sdb_ppt" INTEGER NOT NULL,
    "pp_ss_wc_sdb_au" INTEGER NOT NULL,
    "pp_ss_sdb_chauff_loc" INTEGER NOT NULL,
    "pp_ss_sdb_chauff_ppt" INTEGER NOT NULL,
    "pp_ss_sdb_chauff_au" INTEGER NOT NULL,
    "pp_ss_3elts_loc" INTEGER NOT NULL,
    "pp_ss_3elts_ppt" INTEGER NOT NULL,
    "pp_ss_3elts_au" INTEGER NOT NULL,
    "pp_ss_ent_wc_loc" INTEGER NOT NULL,
    "pp_ss_ent_wc_ppt" INTEGER NOT NULL,
    "pp_ss_ent_wc_au" INTEGER NOT NULL,
    "pp_ss_ent_chauff_loc" INTEGER NOT NULL,
    "pp_ss_ent_chauff_ppt" INTEGER NOT NULL,
    "pp_ss_ent_chauff_au" INTEGER NOT NULL,
    "pp_ss_ent_sdb_loc" INTEGER NOT NULL,
    "pp_ss_ent_sdb_ppt" INTEGER NOT NULL,
    "pp_ss_ent_sdb_au" INTEGER NOT NULL,
    "pp_ss_ent_wc_chauff_loc" INTEGER NOT NULL,
    "pp_ss_ent_wc_chauff_ppt" INTEGER NOT NULL,
    "pp_ss_ent_wc_chauff_au" INTEGER NOT NULL,
    "pp_ss_ent_wc_sdb_loc" INTEGER NOT NULL,
    "pp_ss_ent_wc_sdb_ppt" INTEGER NOT NULL,
    "pp_ss_ent_wc_sdb_au" INTEGER NOT NULL,
    "pp_ss_ent_sdb_chauff_loc" INTEGER NOT NULL,
    "pp_ss_ent_sdb_chauff_ppt" INTEGER NOT NULL,
    "pp_ss_ent_sdb_chauff_au" INTEGER NOT NULL,
    "pp_ss_ent_3elts_loc" INTEGER NOT NULL,
    "pp_ss_ent_3elts_ppt" INTEGER NOT NULL,
    "pp_ss_ent_3elts_au" INTEGER NOT NULL,
    "pp_ss_quali_ent_wc_loc" INTEGER NOT NULL,
    "pp_ss_quali_ent_wc_ppt" INTEGER NOT NULL,
    "pp_ss_quali_ent_wc_au" INTEGER NOT NULL,
    "pp_ss_quali_ent_chauff_loc" INTEGER NOT NULL,
    "pp_ss_quali_ent_chauff_ppt" INTEGER NOT NULL,
    "pp_ss_quali_ent_chauff_au" INTEGER NOT NULL,
    "pp_ss_quali_ent_sdb_loc" INTEGER NOT NULL,
    "pp_ss_quali_ent_sdb_ppt" INTEGER NOT NULL,
    "pp_ss_quali_ent_sdb_au" INTEGER NOT NULL,
    "pp_ss_quali_ent_wc_chauff_loc" INTEGER NOT NULL,
    "pp_ss_quali_ent_wc_chauff_ppt" INTEGER NOT NULL,
    "pp_ss_quali_ent_wc_chauff_au" INTEGER NOT NULL,
    "pp_ss_quali_ent_wc_sdb_loc" INTEGER NOT NULL,
    "pp_ss_quali_ent_wc_sdb_ppt" INTEGER NOT NULL,
    "pp_ss_quali_ent_wc_sdb_au" INTEGER NOT NULL,
    "pp_ss_quali_ent_sdb_chauff_loc" INTEGER NOT NULL,
    "pp_ss_quali_ent_sdb_chauff_ppt" INTEGER NOT NULL,
    "pp_ss_quali_ent_sdb_chauff_au" INTEGER NOT NULL,
    "pp_ss_quali_ent_3elts_loc" INTEGER NOT NULL,
    "pp_ss_quali_ent_3elts_ppt" INTEGER NOT NULL,
    "pp_ss_quali_ent_3elts_au" INTEGER NOT NULL,
    "epci_code" TEXT NOT NULL,

    CONSTRAINT "bad_quality_fonciers_pkey" PRIMARY KEY ("epci_code")
);

-- CreateTable
CREATE TABLE "filocom_flux" (
    "parctot" DOUBLE PRECISION NOT NULL,
    "tx_rp_parctot" DOUBLE PRECISION NOT NULL,
    "tx_rs_parctot" DOUBLE PRECISION NOT NULL,
    "tx_lv_parctot" DOUBLE PRECISION NOT NULL,
    "tx_rest_parctot" DOUBLE PRECISION NOT NULL,
    "tx_disp_parctot" DOUBLE PRECISION NOT NULL,
    "epci_code" TEXT NOT NULL,

    CONSTRAINT "filocom_flux_pkey" PRIMARY KEY ("epci_code")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demographic_evolution_omphale" ADD CONSTRAINT "demographic_evolution_omphale_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demographic_evolution_population" ADD CONSTRAINT "demographic_evolution_population_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "physical_inadequation_filo" ADD CONSTRAINT "physical_inadequation_filo_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "physical_inadequation_rp" ADD CONSTRAINT "physical_inadequation_rp_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_inadequation" ADD CONSTRAINT "financial_inadequation_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hosted_filocom" ADD CONSTRAINT "hosted_filocom_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hosted_finess" ADD CONSTRAINT "hosted_finess_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hosted_sne" ADD CONSTRAINT "hosted_sne_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_parc" ADD CONSTRAINT "social_parc_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel" ADD CONSTRAINT "hotel_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "makeshift_housing_rp" ADD CONSTRAINT "makeshift_housing_rp_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "makeshift_housing_sne" ADD CONSTRAINT "makeshift_housing_sne_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homeless" ADD CONSTRAINT "homeless_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bad_quality_filocom" ADD CONSTRAINT "bad_quality_filocom_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bad_quality_rp" ADD CONSTRAINT "bad_quality_rp_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bad_quality_fonciers" ADD CONSTRAINT "bad_quality_fonciers_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "filocom_flux" ADD CONSTRAINT "filocom_flux_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
