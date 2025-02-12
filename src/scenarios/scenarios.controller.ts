import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Put } from '@nestjs/common'
import { Prisma, Role } from '@prisma/client'
import { User } from '~/common/decorators/authenticated-user'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { ScenariosService } from '~/scenarios/scenarios.service'
import { TScenario } from '~/schemas/scenarios/scenario'
import { TUser } from '~/schemas/users/user'

@Controller('scenarios')
export class ScenariosController {
  constructor(private readonly scenariosService: ScenariosService) {}

  @AccessControl({
    entity: Prisma.ModelName.Scenario,
    roles: [Role.USER, Role.ADMIN],
  })
  @HttpCode(HttpStatus.OK)
  @Get()
  async list(@User() { id: userId }: TUser) {
    return this.scenariosService.list(userId)
  }

  @AccessControl({
    entity: Prisma.ModelName.Scenario,
    paramName: 'id',
    roles: [Role.ADMIN, Role.USER],
  })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getScenario(@Param('id') id: string, @User() { id: userId }: TUser) {
    return this.scenariosService.get(userId, id)
  }

  @AccessControl({
    entity: Prisma.ModelName.Scenario,
    paramName: 'id',
    roles: [Role.ADMIN, Role.USER],
  })
  @Put(':id')
  @HttpCode(HttpStatus.ACCEPTED)
  async updateScenario(@Param('id') id: string, @Body() data: Partial<TScenario>, @User() { id: userId }: TUser) {
    return this.scenariosService.update(userId, id, data)
  }

  @AccessControl({
    entity: Prisma.ModelName.Scenario,
    paramName: 'id',
    roles: [Role.ADMIN, Role.USER],
  })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteScenario(@Param('id') id: string, @User() { id: userId }: TUser) {
    return this.scenariosService.delete(userId, id)
  }
}
