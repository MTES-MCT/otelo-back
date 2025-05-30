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

export const ZNewConstructionsChartData = z.object({
  code: z.string(),
  data: z.object({
    housingNeeds: z.record(z.number()),
    surplusHousing: z.record(z.number()),
  }),
  metadata: z.object({ max: z.number(), min: z.number() }),
})
export type TNewConstructionsChartData = z.infer<typeof ZNewConstructionsChartData>

export const ZNewConstructionsChartDataResult = z.object({
  epcis: z.array(ZNewConstructionsChartData),
})
export type TNewConstructionsChartDataResult = z.infer<typeof ZNewConstructionsChartDataResult>
