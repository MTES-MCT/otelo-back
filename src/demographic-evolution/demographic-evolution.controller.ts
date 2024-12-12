import { Controller, Get, Query } from '@nestjs/common'
import { Role } from '@prisma/client'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { DemographicEvolutionService } from '~/demographic-evolution/demographic-evolution.service'
import { TGetDemographicEvolutionByEpciQuery } from '~/schemas/demographic-evolution/demographic-evolution'

@Controller('demographic-evolution')
export class DemographicEvolutionController {
  constructor(private readonly demographicEvolutionService: DemographicEvolutionService) {}

  @AccessControl({
    roles: [Role.ADMIN, Role.USER],
  })
  @Get('/omphale')
  async getDemographicEvolution(@Query() { epciCode }: TGetDemographicEvolutionByEpciQuery) {
    return this.demographicEvolutionService.getDemographicEvolution(epciCode)
  }

  @AccessControl({
    roles: [Role.ADMIN, Role.USER],
  })
  @Get('/population')
  async getPopulationDemographicEvolution(@Query() { epciCode }: TGetDemographicEvolutionByEpciQuery) {
    return this.demographicEvolutionService.getDemographicEvolutionPopulation(epciCode)
  }
}
