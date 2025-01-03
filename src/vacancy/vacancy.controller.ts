import { Controller, Get, Query } from '@nestjs/common'
import { Role, VacancyAccommodation } from '@prisma/client'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { VacancyService } from '~/vacancy/vacancy.service'

@Controller('vacancy')
export class VacancyController {
  constructor(private readonly vacancyService: VacancyService) {}

  @AccessControl({
    roles: [Role.ADMIN, Role.USER],
  })
  @Get()
  async getVacancy(@Query() { epciCode }: { epciCode: string }): Promise<VacancyAccommodation> {
    return this.vacancyService.getVacancy(epciCode)
  }
}
