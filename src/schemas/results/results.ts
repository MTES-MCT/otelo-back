import { z } from 'zod'
import { ZCalculationResult, ZChartDataResult, ZNewConstructionsChartDataResult } from '~/schemas/calculator/calculation-result'

export const ZStockRequirementsResults = z.object({
  badQuality: ZCalculationResult,
  financialInadequation: ZCalculationResult,
  hosted: ZCalculationResult,
  physicalInadequation: ZCalculationResult,
  socialParc: ZCalculationResult,
  noAccomodation: ZCalculationResult,
})

export type TStockRequirementsResults = z.infer<typeof ZStockRequirementsResults>

export const ZResults = ZStockRequirementsResults.extend({
  demographicEvolution: ZCalculationResult,
  epcisTotals: z.array(z.object({ epciCode: z.string(), total: z.number(), totalFlux: z.number(), totalStock: z.number() })),
  newConstructions: ZNewConstructionsChartDataResult,
  renewalNeeds: ZCalculationResult,
  secondaryResidenceAccomodationEvolution: ZCalculationResult,
  sitadel: ZChartDataResult,
  total: z.number(),
  totalFlux: z.number(),
  totalStock: z.number(),
  vacantAccomodationEvolution: ZCalculationResult,
})

export type TResults = z.infer<typeof ZResults>
