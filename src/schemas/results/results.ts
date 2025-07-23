import { z } from 'zod'
import { ZCalculationResult, ZChartDataResult, ZFlowRequirementChartDataResult } from '~/schemas/calculator/calculation-result'

export const ZStockRequirementsResults = z.object({
  badQuality: ZCalculationResult,
  financialInadequation: ZCalculationResult,
  hosted: ZCalculationResult,
  physicalInadequation: ZCalculationResult,
  noAccomodation: ZCalculationResult,
})

export type TStockRequirementsResults = z.infer<typeof ZStockRequirementsResults>

export const ZResults = ZStockRequirementsResults.extend({
  epcisTotals: z.array(z.object({ epciCode: z.string(), total: z.number(), totalFlux: z.number(), totalStock: z.number() })),
  flowRequirement: ZFlowRequirementChartDataResult,
  sitadel: ZChartDataResult,
  total: z.number(),
  totalFlux: z.number(),
  totalStock: z.number(),
  vacantAccomodation: z.number(),
})

export type TResults = z.infer<typeof ZResults>
