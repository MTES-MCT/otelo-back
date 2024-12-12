import { z } from 'zod'
import { ZDemographicEvolution } from '~/schemas/demographic-evolution/demographic-evolution'

export const ZResults = z.object({
  demographicEvolution: z.object({
    currentProjection: z.number(),
    futureProjections: ZDemographicEvolution,
  }),
  total: z.number(),
  totalFlux: z.number(),
  totalStock: z.number(),
})

export type TResults = z.infer<typeof ZResults>
