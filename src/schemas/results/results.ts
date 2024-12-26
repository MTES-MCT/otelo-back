import { z } from 'zod'
import { ZDemographicEvolution } from '~/schemas/demographic-evolution/demographic-evolution'

export const ZResults = z.object({
  badQuality: z.number(),
  demographicEvolution: z.object({
    currentProjection: z.number(),
    futureProjections: ZDemographicEvolution,
  }),
  financialInadequation: z.number(),
  hosted: z.number(),
  noAccomodation: z.number(),
  physicalInadequation: z.number(),
  renewalNeeds: z.number(),
  secondaryResidenceAccomodationEvolution: z.number(),
  socialParc: z.number(),
  total: z.number(),
  totalFlux: z.number(),
  totalStock: z.number(),
  vacantAccomodationEvolution: z.number(),
})

export type TResults = z.infer<typeof ZResults>
