import { z } from 'zod'
import { ZEpci } from '~/schemas/epcis/epci'
import { ZScenario } from '~/schemas/scenarios/scenario'
import { ZSimulation } from './simulation'

export const ZCreateSimulation = ZSimulation.omit({
  createdAt: true,
  id: true,
  updatedAt: true,
})

export type TCreateSimulation = z.infer<typeof ZCreateSimulation>

export const ZInitSimulation = ZCreateSimulation.extend({
  epci: ZEpci,
  scenario: ZScenario,
})

export type TInitSimulation = z.infer<typeof ZInitSimulation>
