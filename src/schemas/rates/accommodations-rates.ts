import { z } from 'zod'

const AccommodationRateData = z.object({
  vacancyRate: z.number(),
  longTermVacancyRate: z.number(),
  shortTermVacancyRate: z.number(),
  txRs: z.number(),
  vacancy: z.object({
    nbAccommodation: z.number(),
    year: z.number().optional(),
  }),
})

export const ZEpcisAccommodationRates = z.record(z.string(), AccommodationRateData)

export type TEpcisAccommodationRates = z.infer<typeof ZEpcisAccommodationRates>
