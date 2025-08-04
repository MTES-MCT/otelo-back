import { Injectable } from '@nestjs/common'
import { NeedsCalculationService } from '~/calculation/needs-calculation/needs-calculation.service'
import { PrismaService } from '~/db/prisma.service'
import { TResults } from '~/schemas/results/results'
import { TSimulationWithResults } from '~/schemas/simulations/simulation'
import { SimulationsService } from '~/simulations/simulations.service'

@Injectable()
export class ResultsService {
  constructor(
    private readonly simulationsService: SimulationsService,
    private readonly needsCalculationService: NeedsCalculationService,
    private readonly prisma: PrismaService,
  ) {}

  async getResults(simulationId: string): Promise<TSimulationWithResults> {
    const simulation = await this.simulationsService.get(simulationId)
    const results = await this.needsCalculationService.calculate()

    await this.upsertSimulationResults(simulationId, results)
    return { ...simulation, results }
  }

  async upsertSimulationResults(simulationId: string, results: TResults) {
    const { epcisTotals } = results

    const upsertOperations = epcisTotals.map((epciTotal) =>
      this.prisma.simulationResults.upsert({
        where: {
          epciCode_simulationId: {
            epciCode: epciTotal.epciCode,
            simulationId,
          },
        },
        update: {
          totalFlux: epciTotal.totalFlux,
          totalStock: epciTotal.totalStock,
          vacantAccomodation: epciTotal.vacantAccomodation || 0,
        },
        create: {
          epciCode: epciTotal.epciCode,
          simulationId,
          totalFlux: epciTotal.totalFlux,
          totalStock: epciTotal.totalStock,
          vacantAccomodation: epciTotal.vacantAccomodation || 0,
        },
      }),
    )

    await Promise.all(upsertOperations)
  }
}
