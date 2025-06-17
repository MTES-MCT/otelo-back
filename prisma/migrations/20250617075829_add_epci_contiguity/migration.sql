-- CreateTable
CREATE TABLE "epci_contiguity" (
    "epci_code" TEXT NOT NULL,
    "contiguous_epci_code" TEXT NOT NULL,

    CONSTRAINT "epci_contiguity_pkey" PRIMARY KEY ("epci_code","contiguous_epci_code")
);

-- AddForeignKey
ALTER TABLE "epci_contiguity" ADD CONSTRAINT "epci_contiguity_epci_code_fkey" FOREIGN KEY ("epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "epci_contiguity" ADD CONSTRAINT "epci_contiguity_contiguous_epci_code_fkey" FOREIGN KEY ("contiguous_epci_code") REFERENCES "epcis"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
