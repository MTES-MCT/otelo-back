import { z } from 'zod'
import { ZCommonDateFields } from '~/schemas/common-date-fields'
import { ZEpci } from '~/schemas/epcis/epci'
import { ZResults } from '~/schemas/results/results'
import { ZScenario } from '~/schemas/scenarios/scenario'

export const ZSimulation = ZCommonDateFields.extend({
  datasourceId: z.string(),
  epciCode: z.string(),
  id: z.string(),
  name: z.string(),
  scenarioId: z.string(),
  userId: z.string(),
})

export type TSimulation = z.infer<typeof ZSimulation>

export const ZSimulationWithEpci = ZSimulation.pick({
  createdAt: true,
  id: true,
  updatedAt: true,
}).extend({
  epci: ZEpci,
})

export type TSimulationWithEpci = z.infer<typeof ZSimulationWithEpci>

export const ZSimulationWithEpciAndScenario = ZSimulationWithEpci.extend({
  scenario: ZScenario,
})

export type TSimulationWithEpciAndScenario = z.infer<typeof ZSimulationWithEpciAndScenario>

export const ZSimulationWithResults = ZSimulationWithEpciAndScenario.extend({
  results: ZResults,
})

export type TSimulationWithResults = z.infer<typeof ZSimulationWithResults>
