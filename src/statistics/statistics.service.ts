import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'

@Injectable()
export class StatisticsService {
  constructor(
    private prisma: PrismaService,
  ) {}

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
    totalHousingNeeds: number
    totalPoorHousingCommitments: number
    totalVacantHousingRemobilization: number
  }> {
    // For now, return placeholder values since the ResultsService depends on HTTP request context
    // TODO: Implement a way to calculate results without HTTP request context
    return {
      totalHousingNeeds: 0,
      totalPoorHousingCommitments: 0,
      totalVacantHousingRemobilization: 0,
    }
  }

  async getUsersWithExportedScenariosCount(): Promise<number> {
    const usersWithExports = await this.prisma.user.count({
      where: {
        simulations: {
          some: {
            exported: true,
          },
        },
      },
    })

    return usersWithExports
  }
}
