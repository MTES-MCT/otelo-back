import { z } from 'zod'

export type TDataVisualisation =
  | 'population-evolution'
  | 'menage-evolution'
  | 'projection-population-evolution'
  | 'projection-menages-evolution'

// Define a schema for the individual RP data item
const ZRPDataItem = z.object({
  menage: z.number().optional(),
  population: z.number().optional(),
  year: z.number(),
})

export type TRPDataItem = z.infer<typeof ZRPDataItem>

export const ZRPDataResults = z.object({
  data: z.array(ZRPDataItem),
  epci: z.object({
    code: z.string(),
    name: z.string(),
  }),
  metadata: z.object({
    max: z.number(),
    min: z.number(),
  }),
})

export type TRPDataResults = z.infer<typeof ZRPDataResults>

export const ZRPDataTable = z.record(
  z.object({
    annualEvolution: z
      .record(
        z.object({
          percent: z.string(),
          value: z.number(),
        }),
      )
      .optional(),
    name: z.string(),
  }),
)

export type TRPDataTable = z.infer<typeof ZRPDataTable>
