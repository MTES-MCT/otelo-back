import { Controller, Get, Query } from '@nestjs/common'
import { Role } from '@prisma/client'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { DataVisualisationService } from '~/data-visualisation/data-visualisation.service'
import { TDataVisualisationQuery } from '~/schemas/data-visualisation/data-visualisation'

@Controller('data-visualisation')
export class DataVisualisationController {
  constructor(private readonly dataVisualisationService: DataVisualisationService) {}

  @AccessControl({
    roles: [Role.ADMIN, Role.USER],
  })
  @Get()
  async get(@Query() query: TDataVisualisationQuery) {
    return this.dataVisualisationService.getDataByType(query)
  }
}
