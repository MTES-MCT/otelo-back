import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'

@Injectable()
export class RpInseeService {
  constructor(private readonly prismaService: PrismaService) {}

  async getRPByEpci(epciCode: string, type: 'menage' | 'population') {
    const data = await this.prismaService.rP.findMany({
      select: { [type]: true, year: true },
      where: {
        epciCode,
      },
    })

    const { max, min } = data.reduce(
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
      data,
      metadata: {
        max,
        min,
      },
    }
  }

  async getRP(epcis: string[], type: 'menage' | 'population') {
    const results = await Promise.all(
      epcis.map(async (epci) => ({
        ...(await this.getRPByEpci(epci, type)),
        epci,
      })),
    )

    // Bar chart
    const yearMap = results.reduce(
      (acc, { data, epci }) => {
        data.forEach((item) => {
          const year = item.year
          if (!acc[year]) {
            acc[year] = { year }
          }
          acc[year][epci] = item[type]
        })
        return acc
      },
      {} as Record<number, { [key: string]: number; year: number }>,
    )

    return {
      barChart: Object.values(yearMap).sort((a, b) => a.year - b.year),
      linearChart: results.reduce(
        (acc, { data, epci, metadata }) => ({
          ...acc,
          [epci]: { data, epci, metadata },
        }),
        {},
      ),
    }
  }
}
