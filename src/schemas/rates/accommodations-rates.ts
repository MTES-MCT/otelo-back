import { z } from 'zod'

const AccommodationRateData = z.object({
  txLv: z.number(),
  txRs: z.number(),
  vacancy: z.object({
    nbAccommodation: z.number(),
    txLvLongue: z.number(),
  }),
})

export const ZEpcisAccommodationRates = z.record(z.string(), AccommodationRateData)

export type TEpcisAccommodationRates = z.infer<typeof ZEpcisAccommodationRates>
