import { Body, Controller, HttpCode, HttpStatus, Param, Patch } from '@nestjs/common'
import { Role } from '@prisma/client'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { UsersService } from '~/users/users.service'

@Controller('admin')
export class AdminController {
  constructor(private readonly usersService: UsersService) {}

  @AccessControl({
    roles: [Role.ADMIN],
  })
  @HttpCode(HttpStatus.OK)
  @Patch('/users/:id/access')
  async update(@Param('id') id: string, @Body() body: { hasAccess: boolean }) {
    return this.usersService.updateAccess(id, body.hasAccess)
  }
}
