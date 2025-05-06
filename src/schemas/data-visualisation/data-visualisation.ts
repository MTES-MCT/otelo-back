import { z } from 'zod'
import { ZDemographicEvolutionByEpci } from '~/schemas/demographic-evolution/demographic-evolution'

export type TDataVisualisation =
  | 'population-evolution'
  | 'menage-evolution'
  | 'projection-population-evolution'
  | 'projection-menages-evolution'
  | 'residences-secondaires'
  | 'logements-vacants'

const ZRPDataItem = z.object({
  menage: z.number().optional(),
  population: z.number().optional(),
  secondaryAccommodation: z.number().optional(),
  vacant: z.number().optional(),
  totalAccommodation: z.number(),
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

export const ZDemographicProjectionResults = z.object({
  data: z.array(ZDemographicEvolutionByEpci),
  metadata: z.object({
    max: z.number(),
    min: z.number(),
  }),
})

export type TDemographicProjectionResults = z.infer<typeof ZDemographicProjectionResults>

export const ZDemographicProjectionDataTable = z.record(
  z.object({
    annualEvolution: z
      .record(
        z.object({
          basse: z.object({
            percent: z.string(),
            value: z.number(),
          }),
          central: z.object({
            percent: z.string(),
            value: z.number(),
          }),
          haute: z.object({
            percent: z.string(),
            value: z.number(),
          }),
        }),
      )
      .optional(),
    name: z.string(),
  }),
)

export type TDemographicProjectionDataTable = z.infer<typeof ZDemographicProjectionDataTable>

export const ZDataVisualisationQuery = z.object({
  epci: z.string(),
  type: z.string(),
  populationType: z.string().optional(),
  source: z.string().optional(),
})

export type TDataVisualisationQuery = z.infer<typeof ZDataVisualisationQuery>

export const ZVacancyAccommodationDataTable = z.object({
  annualEvolution: z
    .record(
      z.object({
        percent: z.string(),
        value: z.number(),
      }),
    )
    .optional(),
  name: z.string(),
})

export type TVacancyAccommodationDataTable = z.infer<typeof ZVacancyAccommodationDataTable>

const ZVacancyAccommodation = z.object({
  year: z.number(),
  nbTotal: z.number(),
  nbLogVac2Less: z.number(),
  nbLogVac2More: z.number(),
  propLogVac2Less: z.number(),
  propLogVac2More: z.number(),
})

export const ZVacancyAccommodationEvolution = z.object({
  data: z.array(ZVacancyAccommodation),
  epci: z.object({
    code: z.string(),
    name: z.string(),
  }),
  metadata: z.object({
    max: z.number(),
    min: z.number(),
  }),
})

export type TVacancyAccommodationEvolution = z.infer<typeof ZVacancyAccommodationEvolution>
