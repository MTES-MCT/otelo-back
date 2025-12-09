import { Controller, Get } from '@nestjs/common'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { Role } from '~/generated/prisma/enums'
import { StatisticsService } from './statistics.service'

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @AccessControl({ roles: [Role.ADMIN] })
  @Get()
  async getStatistics() {
    const [totalScenarios, averageScenariosPerUser, activeEpcisCount, exportedStats, usersWithExportedScenarios] = await Promise.all([
      this.statisticsService.getTotalScenariosCount(),
      this.statisticsService.getAverageScenariosPerUser(),
      this.statisticsService.getActiveEpcisCount(),
      this.statisticsService.getExportedScenariosStatistics(),
      this.statisticsService.getUsersWithExportedScenariosCount(),
    ])

    return {
      totalScenarios,
      averageScenariosPerUser,
      activeEpcisCount,
      totalHousingNeedsSum: exportedStats.totalHousingNeedsSum,
      totalStockSum: exportedStats.totalStockSum,
      totalVacantSum: exportedStats.totalVacantSum,
      usersWithExportedScenarios,
    }
  }
}
