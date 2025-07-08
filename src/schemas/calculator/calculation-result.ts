import { z } from 'zod'

export const ZEpciCalculationResult = z.object({ epciCode: z.string(), value: z.number() })
export type TEpciCalculationResult = z.infer<typeof ZEpciCalculationResult>

export const ZCalculationResult = z.object({
  epcis: z.array(ZEpciCalculationResult),
  total: z.number(),
})

export type TCalculationResult = z.infer<typeof ZCalculationResult>

export const ZChartData = z.object({
  code: z.string(),
  data: z.array(z.object({ value: z.number(), year: z.number() })),
  metadata: z.object({ max: z.number(), min: z.number() }),
})
export type TChartData = z.infer<typeof ZChartData>

export const ZChartDataResult = z.object({
  epcis: z.array(ZChartData),
})
export type TChartDataResult = z.infer<typeof ZChartDataResult>

export const ZFlowRequirementChartData = z.object({
  code: z.string(),
  data: z.object({
    parcEvolution: z.record(z.number()),
    housingNeeds: z.record(z.number()),
    surplusHousing: z.record(z.number()),
    peakYear: z.number(),
  }),
  totals: z.object({
    demographicEvolution: z.number(),
    renewalNeeds: z.number(),
    secondaryResidenceAccomodationEvolution: z.number(),
    surplusHousing: z.number(),
    housingNeeds: z.number(),
    vacantAccomodation: z.number(),
    shortTermVacantAccomodation: z.number(),
    longTermVacantAccomodation: z.number(),
  }),
  metadata: z.object({ max: z.number(), min: z.number() }),
})
export type TFlowRequirementChartData = z.infer<typeof ZFlowRequirementChartData>

export const ZFlowRequirementChartDataResult = z.object({
  epcis: z.array(ZFlowRequirementChartData),
})
export type TFlowRequirementChartDataResult = z.infer<typeof ZFlowRequirementChartDataResult>
