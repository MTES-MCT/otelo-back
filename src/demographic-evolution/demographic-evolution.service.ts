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

  async getDemographicEvolution(epciCodes: string) {
    const epcisArray = epciCodes.split(',')
    const projections = await this.prismaService.$queryRaw<
      Array<{
        epci_code: string
        year: number
        centralB: number
        centralC: number
        centralH: number
        phB: number
        phC: number
        phH: number
        pbB: number
        pbC: number
        pbH: number
      }>
    >`
      SELECT 
        epci_code,
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
      WHERE epci_code IN (${Prisma.join(epcisArray)})
      ORDER BY epci_code, year ASC
    `

    const groupedByEpci = projections.reduce(
      (acc, projection) => {
        const { epci_code, ...data } = projection

        if (!acc[epci_code]) {
          acc[epci_code] = {
            data: [],
            metadata: { max: -Infinity, min: Infinity },
          }
        }

        acc[epci_code].data.push(data)

        Object.entries(data).forEach(([key, value]) => {
          if (key !== 'year') {
            const numValue = Number(value)
            acc[epci_code].metadata.min = Math.min(acc[epci_code].metadata.min, numValue)
            acc[epci_code].metadata.max = Math.max(acc[epci_code].metadata.max, numValue)
          }
        })

        return acc
      },
      {} as Record<string, { data: Array<Omit<(typeof projections)[0], 'epci_code'>>; metadata: { max: number; min: number } }>,
    )

    return groupedByEpci
  }

  async getDemographicEvolutionPopulationByEpci(epciCodes: string, years?: number[]) {
    const epcisArray = epciCodes.split(',')
    const whereCond: Prisma.Sql = Prisma.sql`WHERE epci_code IN (${Prisma.join(epcisArray)})${years && years.length > 0 ? Prisma.sql` AND year IN (${Prisma.join(years)})` : Prisma.empty}`

    const projections = await this.prismaService.$queryRaw<
      Array<{
        epci_code: string
        year: number
        central: number
        haute: number
        basse: number
      }>
    >`
        SELECT 
          epci_code,
          year,
          ROUND(central) as "central",
          ROUND(haute) as "haute",
          ROUND(basse) as "basse"
        FROM demographic_evolution_population
        ${whereCond}
        ORDER BY epci_code, year ASC
      `

    const groupedByEpci = projections.reduce(
      (acc, projection) => {
        const { epci_code, ...data } = projection

        if (!acc[epci_code]) {
          acc[epci_code] = {
            data: [],
            metadata: { max: -Infinity, min: Infinity },
          }
        }

        acc[epci_code].data.push(data)

        Object.entries(data).forEach(([key, value]) => {
          if (key !== 'year') {
            const numValue = Number(value)
            acc[epci_code].metadata.min = Math.min(acc[epci_code].metadata.min, numValue)
            acc[epci_code].metadata.max = Math.max(acc[epci_code].metadata.max, numValue)
          }
        })

        return acc
      },
      {} as Record<string, { data: Array<Omit<(typeof projections)[0], 'epci_code'>>; metadata: { max: number; min: number } }>,
    )

    return groupedByEpci
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
      epcis.map(async (epci) => {
        const data = await this.getDemographicEvolutionPopulationByEpci(epci.code, [2021, 2030, 2040, 2050])
        return {
          data: data[epci.code].data,
          metadata: data[epci.code].metadata,
          epci,
        }
      }),
    )

    const tableData = createTableData(results)

    return {
      linearChart: results.reduce(
        (acc, { data, metadata, epci }) => ({
          ...acc,
          [epci.code]: { data, metadata, epci },
        }),
        {},
      ),
      tableData,
    }
  }
}
