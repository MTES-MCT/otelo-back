import { z } from 'zod'
import { ZCalculationResult } from '~/schemas/calculator/calculation-result'

export const ZResults = z.object({
  badQuality: ZCalculationResult,
  // demographicEvolution: z.object({
  //   currentProjection: z.number(),
  //   futureProjections: ZDemographicEvolution,
  // }),
  demographicEvolution: ZCalculationResult,
  epcisTotals: z.array(z.object({ epciCode: z.string(), total: z.number(), totalFlux: z.number(), totalStock: z.number() })),
  financialInadequation: ZCalculationResult,
  hosted: ZCalculationResult,
  noAccomodation: ZCalculationResult,
  physicalInadequation: ZCalculationResult,
  renewalNeeds: ZCalculationResult,
  secondaryResidenceAccomodationEvolution: ZCalculationResult,
  socialParc: ZCalculationResult,
  total: z.number(),
  totalFlux: z.number(),
  totalStock: z.number(),
  vacantAccomodationEvolution: ZCalculationResult,
})

export type TResults = z.infer<typeof ZResults>
