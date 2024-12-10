import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Query } from '@nestjs/common'
import { Role } from '@prisma/client'
import { User } from '~/common/decorators/authenticated-user'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { TUser } from '~/schemas/users/user'
import { UsersService } from '~/users/users.service'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @AccessControl({
    roles: [Role.ADMIN],
  })
  @HttpCode(HttpStatus.OK)
  @Get()
  async list() {
    return this.usersService.list()
  }

  @AccessControl({
    roles: [Role.ADMIN],
  })
  @HttpCode(HttpStatus.OK)
  @Get('/search')
  async search(@Query('q') query: string) {
    return this.usersService.search(query)
  }

  @AccessControl({
    roles: [Role.ADMIN],
  })
  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  async delete(@User() { id: userId }: TUser, @Param('id') id: string) {
    return this.usersService.delete(userId, id)
  }
}
