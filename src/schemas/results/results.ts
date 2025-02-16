import { z } from 'zod'
import { ZCalculationResult, ZChartDataResult } from '~/schemas/calculator/calculation-result'

export const ZResults = z.object({
  badQuality: ZCalculationResult,
  demographicEvolution: ZCalculationResult,
  epcisTotals: z.array(z.object({ epciCode: z.string(), total: z.number(), totalFlux: z.number(), totalStock: z.number() })),
  financialInadequation: ZCalculationResult,
  hosted: ZCalculationResult,
  newConstructions: ZChartDataResult,
  noAccomodation: ZCalculationResult,
  physicalInadequation: ZCalculationResult,
  renewalNeeds: ZCalculationResult,
  secondaryResidenceAccomodationEvolution: ZCalculationResult,
  sitadel: ZChartDataResult,
  socialParc: ZCalculationResult,
  total: z.number(),
  totalFlux: z.number(),
  totalStock: z.number(),
  vacantAccomodationEvolution: ZCalculationResult,
})

export type TResults = z.infer<typeof ZResults>
