import { Controller, Get, Param } from '@nestjs/common'
import { Prisma, Role } from '@prisma/client'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { ResultsService } from '~/results/results.service'

@Controller('simulations')
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @AccessControl({
    entity: Prisma.ModelName.Simulation,
    paramName: 'id',
    roles: [Role.USER, Role.ADMIN],
  })
  @Get(':simulationId/results')
  async getResults(@Param('simulationId') simulationId: string) {
    return this.resultsService.getResults(simulationId)
  }
}
