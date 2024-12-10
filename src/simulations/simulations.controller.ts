import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common'
import { Prisma, Role } from '@prisma/client'
import { User } from '~/common/decorators/authenticated-user'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { TInitSimulation } from '~/schemas/simulations/create-simulation'
import { TSimulation } from '~/schemas/simulations/simulation'
import { TUser } from '~/schemas/users/user'
import { SimulationsService } from '~/simulations/simulations.service'

@Controller('simulations')
export class SimulationsController {
  constructor(private readonly simulationsService: SimulationsService) {}

  @AccessControl({
    roles: [Role.USER, Role.ADMIN],
  })
  @HttpCode(HttpStatus.OK)
  @Get()
  async list(@User() { id: userId }: TUser) {
    return this.simulationsService.list(userId)
  }

  @AccessControl({
    entity: Prisma.ModelName.Simulation,
    paramName: 'id',
    roles: [Role.ADMIN, Role.USER],
  })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getSimulation(@Param('id') id: string) {
    return this.simulationsService.get(id)
  }

  @AccessControl({
    roles: [Role.ADMIN, Role.USER],
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() data: TInitSimulation, @User() { id: userId }: TUser) {
    return this.simulationsService.create(userId, data)
  }

  @AccessControl({
    entity: Prisma.ModelName.Simulation,
    paramName: 'id',
    roles: [Role.ADMIN, Role.USER],
  })
  @Put(':id')
  @HttpCode(HttpStatus.ACCEPTED)
  async updateSimulation(@Param('id') id: string, @Body() data: Partial<TSimulation>, @User() { id: userId }: TUser) {
    return this.simulationsService.update(userId, id, data)
  }

  @AccessControl({
    entity: Prisma.ModelName.Simulation,
    paramName: 'id',
    roles: [Role.ADMIN, Role.USER],
  })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSimulation(@Param('id') id: string, @User() { id: userId }: TUser) {
    return this.simulationsService.delete(userId, id)
  }
}
