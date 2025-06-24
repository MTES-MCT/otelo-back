-- CreateTable
CREATE TABLE "sitadel" (
    "year" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,
    "epci_code" TEXT NOT NULL,

    CONSTRAINT "sitadel_pkey" PRIMARY KEY ("epci_code","year")
);

-- AddForeignKey
ALTER TABLE "sitadel" ADD CONSTRAINT "sitadel_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
