import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common'
import { Role } from '@prisma/client'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { CronService } from '~/cron/cron.service'

@Controller('cron')
export class CronController {
  constructor(private readonly cronService: CronService) {}

  @Get('synchro')
  @AccessControl({
    roles: [Role.ADMIN],
  })
  @HttpCode(HttpStatus.OK)
  synchroDS() {
    return this.cronService.handleUserAccessUpdate()
  }
}
