import { z } from 'zod'
import { ZDemographicEvolutionOmphale } from '~/schemas/demographic-evolution/demographic-evolution'

export const ZResults = z.object({
  demographicEvolution: z.object({
    currentProjection: z.number(),
    futureProjections: ZDemographicEvolutionOmphale,
  }),
})

export type TResults = z.infer<typeof ZResults>
