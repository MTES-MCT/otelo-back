import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'
import { TRPDataResults, TRPDataTable } from '~/schemas/data-visualisation/data-visualisation'

const createTableData = (results: TRPDataResults[], type: 'menage' | 'population' | 'secondaryAccommodation' | 'vacant'): TRPDataTable => {
  return results.reduce((acc, { data, epci }) => {
    if (!acc[epci.code]) {
      acc[epci.code] = {
        annualEvolution: {},
        name: epci.name,
      }
    }

    data.forEach((item) => {
      if (item[type]) {
        acc[epci.code][item.year] = {
          value: Math.round(item[type]),
          percent: `${((item[type] / item.totalAccommodation) * 100).toFixed(2)}%`,
        }
      }
    })

    const years = data.map((item) => item.year).sort((a, b) => a - b)

    for (let i = 0; i < years.length - 1; i++) {
      const startYear = years[i]
      const endYear = years[i + 1]
      const startValue = data.find((item) => item.year === startYear)?.[type]
      const endValue = data.find((item) => item.year === endYear)?.[type]

      if (startValue && endValue) {
        const evolutionValue = (endValue - startValue) / (endYear - startYear)
        const evolutionPercent = ((Math.pow(endValue / startValue, 1 / (endYear - startYear)) - 1) * 100).toFixed(2)
        acc[epci.code].annualEvolution![`${startYear}-${endYear}`] = {
          percent: `${evolutionPercent}%`,
          value: Math.round(evolutionValue),
        }
      }
    }

    return acc
  }, {} as TRPDataTable)
}

@Injectable()
export class RpInseeService {
  constructor(private readonly prismaService: PrismaService) {}

  async getRPByEpci(epciCode: string, type: 'menage' | 'population' | 'secondaryAccommodation' | 'vacant') {
    const data = await this.prismaService.rP.findMany({
      select: {
        menage: type === 'menage',
        population: type === 'population',
        secondaryAccommodation: type === 'secondaryAccommodation',
        vacant: type === 'vacant',
        year: true,
        totalAccommodation: true,
      },
      where: {
        epciCode,
      },
    })

    const { max, min } = data.reduce(
      (acc, projection) => {
        Object.entries(projection).forEach(([key, value]) => {
          if (key !== 'year' && key !== 'totalAccommodation') {
            const numValue = Math.round(value)
            acc.min = Math.min(acc.min, numValue)
            acc.max = Math.max(acc.max, numValue)
          }
        })
        return acc
      },
      { max: -Infinity, min: Infinity },
    )

    return {
      data: data.map((item) => ({
        ...item,
        menage: item.menage && Math.round(item.menage),
        population: item.population && Math.round(item.population),
        secondaryAccommodation: item.secondaryAccommodation && Math.round(item.secondaryAccommodation),
        vacant: item.vacant && Math.round(item.vacant),
        totalAccommodation: Math.round(item.totalAccommodation),
      })),
      metadata: {
        max,
        min,
      },
    }
  }

  async getRP(epcis: Array<{ code: string; name: string }>, type: 'menage' | 'population' | 'secondaryAccommodation' | 'vacant') {
    const results = await Promise.all(
      epcis.map(async (epci) => ({
        ...(await this.getRPByEpci(epci.code, type)),
        epci,
      })),
    )

    const tableData = createTableData(results, type)
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
