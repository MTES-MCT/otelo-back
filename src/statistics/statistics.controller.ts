import { Controller, Get } from '@nestjs/common'
import { Role } from '@prisma/client'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { StatisticsService } from './statistics.service'

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  // Add statistics endpoints here
  @AccessControl({ roles: [Role.ADMIN] })
  @Get()
  async getStatistics() {
    // Implement statistics retrieval
    return { message: 'Statistics endpoint' }
  }
}
