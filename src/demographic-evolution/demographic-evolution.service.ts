import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'

@Injectable()
export class DemographicEvolutionService {
  constructor(private readonly prismaService: PrismaService) {}

  async getDemographicEvolution(epciCode: string) {
    const projections = await this.prismaService.$queryRaw<any[]>`
      SELECT 
        year,
        ROUND(central_b) as "centralB",
        ROUND(central_c) as "centralC",
        ROUND(central_h) as "centralH",
        ROUND(ph_b) as "phB",
        ROUND(ph_c) as "phC",
        ROUND(ph_h) as "phH",
        ROUND(pb_b) as "pbB",
        ROUND(pb_c) as "pbC",
        ROUND(pb_h) as "pbH"
      FROM demographic_evolution_omphale
      WHERE epci_code = ${epciCode}
      ORDER BY year ASC
    `

    const { max, min } = projections.reduce(
      (acc, projection) => {
        Object.entries(projection).forEach(([key, value]) => {
          if (key !== 'year') {
            const numValue = Number(value)
            acc.min = Math.min(acc.min, numValue)
            acc.max = Math.max(acc.max, numValue)
          }
        })
        return acc
      },
      { max: -Infinity, min: Infinity },
    )

    return {
      data: projections,
      metadata: {
        max,
        min,
      },
    }
  }

  async getDemographicEvolutionPopulationByEpci(epciCode: string) {
    const projections = await this.prismaService.$queryRaw<any[]>`
      SELECT 
        year,
        ROUND(central) as "central",
        ROUND(haute) as "haute",
        ROUND(basse) as "basse"
      FROM demographic_evolution_population
      WHERE epci_code = ${epciCode}
      ORDER BY year ASC
    `
    const { max, min } = projections.reduce(
      (acc, projection) => {
        Object.entries(projection).forEach(([key, value]) => {
          if (key !== 'year') {
            const numValue = Number(value)
            acc.min = Math.min(acc.min, numValue)
            acc.max = Math.max(acc.max, numValue)
          }
        })
        return acc
      },
      { max: -Infinity, min: Infinity },
    )

    return {
      data: projections,
      metadata: {
        max,
        min,
      },
    }
  }

  async getDemographicEvolutionPopulation(epcis: Array<{ code: string; name: string }>) {
    const results = await Promise.all(
      epcis.map(async (epci) => ({
        data: await this.getDemographicEvolutionPopulationByEpci(epci.code),
        epci,
      })),
    )

    return results.reduce(
      (acc, { data, epci }) => ({
        ...acc,
        [epci.code]: { ...data, name: epci.name },
      }),
      {},
    )
  }
}
