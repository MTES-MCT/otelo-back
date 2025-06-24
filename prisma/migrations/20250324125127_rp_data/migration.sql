-- AlterTable
ALTER TABLE "_EpciToSimulation" ADD CONSTRAINT "_EpciToSimulation_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_EpciToSimulation_AB_unique";

-- CreateTable
CREATE TABLE "rp" (
    "year" INTEGER NOT NULL,
    "menage" DOUBLE PRECISION NOT NULL,
    "population" DOUBLE PRECISION NOT NULL,
    "vacant" DOUBLE PRECISION NOT NULL,
    "principal_accommodation" DOUBLE PRECISION NOT NULL,
    "secondary_accommodation" DOUBLE PRECISION NOT NULL,
    "total_accommodation" DOUBLE PRECISION NOT NULL,
    "epci_code" TEXT NOT NULL,

    CONSTRAINT "rp_pkey" PRIMARY KEY ("epci_code","year")
);

-- AddForeignKey
ALTER TABLE "rp" ADD CONSTRAINT "rp_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
