import { Injectable } from '@nestjs/common'
import { NeedsCalculationService } from '~/calculation/needs-calculation/needs-calculation.service'
import { TSimulationWithResults } from '~/schemas/simulations/simulation'
import { SimulationsService } from '~/simulations/simulations.service'

@Injectable()
export class ResultsService {
  constructor(
    private readonly simulationsService: SimulationsService,
    private readonly needsCalculationService: NeedsCalculationService,
  ) {}

  async getResults(simulationId: string): Promise<TSimulationWithResults> {
    const simulation = await this.simulationsService.get(simulationId)
    const results = await this.needsCalculationService.calculate()
    return { ...simulation, results }
  }
}
