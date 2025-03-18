import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '~/db/prisma.service'
import { TDemographicProjectionDataTable } from '~/schemas/data-visualisation/data-visualisation'
import { TDemographicEvolutionByEpci } from '~/schemas/demographic-evolution/demographic-evolution'

const createTableData = (results: Array<{ data: TDemographicEvolutionByEpci[]; epci: { code: string; name: string } }>) => {
  return results.reduce((acc, { data, epci }) => {
    if (!acc[epci.code]) {
      acc[epci.code] = {
        annualEvolution: {},
        name: epci.name,
      }
    }

    data.forEach((item) => {
      acc[epci.code][item.year] = {
        basse: Math.round(item.basse),
        central: Math.round(item.central),
        haute: Math.round(item.haute),
      }
    })

    const years = data.map((item) => item.year).sort((a, b) => a - b)

    for (let i = 0; i < years.length - 1; i++) {
      const startYear = years[i]
      const endYear = years[i + 1]
      const startValue = data.find((item) => item.year === startYear)
      const endValue = data.find((item) => item.year === endYear)

      if (startValue && endValue) {
        acc[epci.code].annualEvolution![`${startYear}-${endYear}`] = {
          basse: {
            percent: `${((Math.pow(endValue.basse / startValue.basse, 1 / (endYear - startYear)) - 1) * 100).toFixed(2)}%`,
            value: Math.round((endValue.basse - startValue.basse) / (endYear - startYear)),
          },
          central: {
            percent: `${((Math.pow(endValue.central / startValue.central, 1 / (endYear - startYear)) - 1) * 100).toFixed(2)}%`,
            value: Math.round((endValue.central - startValue.central) / (endYear - startYear)),
          },
          haute: {
            percent: `${((Math.pow(endValue.haute / startValue.haute, 1 / (endYear - startYear)) - 1) * 100).toFixed(2)}%`,
            value: Math.round((endValue.haute - startValue.haute) / (endYear - startYear)),
          },
        }
      }
    }

    return acc
  }, {} as TDemographicProjectionDataTable)
}

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

  async getDemographicEvolutionPopulationByEpci(epciCode: string, years?: number[]) {
    const whereCond: Prisma.Sql = Prisma.sql`WHERE epci_code = ${epciCode}${years && years.length > 0 ? Prisma.sql` AND year IN (${Prisma.join(years)})` : Prisma.empty}`

    const projections = await this.prismaService.$queryRaw<any[]>`
        SELECT 
          year,
          ROUND(central) as "central",
          ROUND(haute) as "haute",
          ROUND(basse) as "basse"
        FROM demographic_evolution_population
        ${whereCond}
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

  async getDemographicEvolutionPopulationAndYear(epcis: Array<{ code: string; name: string }>) {
    const results = await Promise.all(
      epcis.map(async (epci) => ({
        ...(await this.getDemographicEvolutionPopulationByEpci(epci.code, [2021, 2030, 2040, 2050])),
        epci,
      })),
    )

    const tableData = createTableData(results)

    return {
      linearChart: results.reduce(
        (acc, { data, epci, metadata }) => ({
          ...acc,
          [epci.code]: { data, epci, metadata },
        }),
        {},
      ),
      tableData,
    }
  }
}
