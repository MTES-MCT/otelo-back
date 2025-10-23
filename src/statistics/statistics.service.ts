import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  async getTotalScenariosCount(): Promise<number> {
    return this.prisma.scenario.count()
  }

  async getAverageScenariosPerUser(): Promise<number> {
    const totalScenarios = await this.prisma.scenario.count()
    const totalUsers = await this.prisma.user.count()

    if (totalUsers === 0) return 0

    return Math.round((totalScenarios / totalUsers) * 100) / 100
  }

  async getActiveEpcisCount(): Promise<number> {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const activeEpcis = await this.prisma.epci.findMany({
      where: {
        simulations: {
          some: {
            scenario: {
              createdAt: {
                gte: sixMonthsAgo,
              },
            },
          },
        },
      },
      select: {
        code: true,
      },
    })

    return activeEpcis.length
  }
  async getExportedScenariosStatistics(): Promise<{
    totalHousingNeedsSum: number
    totalStockSum: number
    totalVacantSum: number
  }> {
    // Get all simulation results for exported simulations
    const exportedResults = await this.prisma.simulationResults.findMany({
      where: {
        simulation: {
          exports: { every: { type: 'POWERPOINT' } },
        },
      },
      select: {
        epciCode: true,
        totalFlux: true,
        totalStock: true,
        vacantAccomodation: true,
      },
    })

    if (exportedResults.length === 0) {
      return {
        totalHousingNeedsSum: 0,
        totalStockSum: 0,
        totalVacantSum: 0,
      }
    }

    // Group results by EPCI code
    const resultsByEpci = exportedResults.reduce(
      (acc, result) => {
        if (!acc[result.epciCode]) {
          acc[result.epciCode] = []
        }
        acc[result.epciCode].push(result)
        return acc
      },
      {} as Record<string, typeof exportedResults>,
    )

    // Calculate averages for each EPCI
    let totalFluxSum = 0
    let totalStockSum = 0
    let totalVacantSum = 0

    for (const epciCode in resultsByEpci) {
      const epciResults = resultsByEpci[epciCode]

      // Calculate averages for this EPCI
      const avgFlux = epciResults.reduce((sum, r) => sum + r.totalFlux, 0) / epciResults.length
      const avgStock = epciResults.reduce((sum, r) => sum + r.totalStock, 0) / epciResults.length
      const avgVacant = epciResults.reduce((sum, r) => sum + r.vacantAccomodation, 0) / epciResults.length

      // Add to totals
      totalFluxSum += avgFlux
      totalStockSum += avgStock
      totalVacantSum += avgVacant
    }

    const results = {
      totalHousingNeedsSum: Math.round(totalFluxSum + totalStockSum),
      totalStockSum: Math.round(totalStockSum),
      totalVacantSum: Math.round(totalVacantSum),
    }

    return results
  }

  async getUsersWithExportedScenariosCount() {
    const powerpointCount = await this.prisma.export.count({
      where: {
        type: 'POWERPOINT',
      },
    })

    const excelCount = await this.prisma.export.count({
      where: {
        type: 'EXCEL',
      },
    })
    return { total: excelCount + powerpointCount, powerpoint: powerpointCount, excel: excelCount }
  }
}
