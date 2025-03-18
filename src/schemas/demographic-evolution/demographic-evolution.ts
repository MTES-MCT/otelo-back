import { z } from 'zod'

export enum EOmphale {
  CENTRAL_B = 'centralB',
  CENTRAL_C = 'centralC',
  CENTRAL_H = 'centralH',
  PB_B = 'pbB',
  PB_C = 'pbC',
  PB_H = 'pbH',
  PH_B = 'phB',
  PH_C = 'phC',
  PH_H = 'phH',
}

export const ZGetDemographicEvolutionByYearAndOmphaleQuery = z.object({
  epciCode: z.string(),
  omphale: z.enum([
    EOmphale.CENTRAL_B,
    EOmphale.CENTRAL_C,
    EOmphale.CENTRAL_H,
    EOmphale.PH_B,
    EOmphale.PH_C,
    EOmphale.PH_H,
    EOmphale.PB_B,
    EOmphale.PB_C,
    EOmphale.PB_H,
  ]),
  year: z.number(),
})

export type TGetDemographicEvolutionByYearAndOmphaleQuery = z.infer<typeof ZGetDemographicEvolutionByYearAndOmphaleQuery>

export const ZGetDemographicEvolutionByOmphaleQuery = ZGetDemographicEvolutionByYearAndOmphaleQuery.pick({
  epciCode: true,
  omphale: true,
})

export type TGetDemographicEvolutionByOmphaleQuery = z.infer<typeof ZGetDemographicEvolutionByOmphaleQuery>

export const ZGetDemographicEvolution = z.object({
  centralB: z.number().optional(),
  centralC: z.number().optional(),
  centralH: z.number().optional(),
  epciCode: z.string(),
  pbB: z.number().optional(),
  pbC: z.number().optional(),
  pbH: z.number().optional(),
  phB: z.number().optional(),
  phC: z.number().optional(),
  phH: z.number().optional(),
  year: z.number(),
})

export type TGetDemographicEvolution = z.infer<typeof ZGetDemographicEvolution>

export const ZDemographicEvolution = z.object({
  data: z.array(
    z.object({
      value: z.number(),
      year: z.number(),
    }),
  ),
  metadata: z.object({
    data: z.object({
      max: z.number(),
      min: z.number(),
    }),
    period: z.object({
      endYear: z.number(),
      startYear: z.number(),
    }),
  }),
})

export type TDemographicEvolution = z.infer<typeof ZDemographicEvolution>

export const ZDemographicEvolutionByEpci = z.object({
  basse: z.number(),
  central: z.number(),
  haute: z.number(),
  year: z.number(),
})

export type TDemographicEvolutionByEpci = z.infer<typeof ZDemographicEvolutionByEpci>

export const ZGetDemographicEvolutionByEpciQuery = z.object({
  epciCode: z.string(),
})

export type TGetDemographicEvolutionByEpciQuery = z.infer<typeof ZGetDemographicEvolutionByEpciQuery>

export interface MaxYearScenario {
  scenario: 'central' | 'haute' | 'basse'
  value: number
  year: number
}
