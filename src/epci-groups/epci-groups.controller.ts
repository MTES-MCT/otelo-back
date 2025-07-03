import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { Role } from '@prisma/client';
import { User } from '~/common/decorators/authenticated-user';
import { AccessControl } from '~/common/decorators/control-access.decorator';
import { TCreateEpciGroupDto, TUpdateEpciGroupDto, TEpciGroupWithEpcis } from '~/schemas/epci-group';
import { TUser } from '~/schemas/users/user';
import { EpciGroupsService } from './epci-groups.service';

@Controller('epci-groups')
export class EpciGroupsController {
  constructor(private readonly epciGroupsService: EpciGroupsService) {}

  @AccessControl({
    roles: [Role.USER, Role.ADMIN],
  })
  @Get()
  async findAll(@User() user: TUser): Promise<TEpciGroupWithEpcis[]> {
    return this.epciGroupsService.findAll(user.id);
  }

  @AccessControl({
    roles: [Role.USER, Role.ADMIN],
  })
  @Get(':id')
  async findOne(@Param('id') id: string, @User() user: TUser): Promise<TEpciGroupWithEpcis> {
    return this.epciGroupsService.findOne(id, user.id);
  }

  @AccessControl({
    roles: [Role.USER, Role.ADMIN],
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() data: TCreateEpciGroupDto,
    @User() user: TUser,
  ): Promise<TEpciGroupWithEpcis> {
    return this.epciGroupsService.create(user.id, data);
  }

  @AccessControl({
    roles: [Role.USER, Role.ADMIN],
  })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: TUpdateEpciGroupDto,
    @User() user: TUser,
  ): Promise<TEpciGroupWithEpcis> {
    return this.epciGroupsService.update(id, user.id, data);
  }

  @AccessControl({
    roles: [Role.USER, Role.ADMIN],
  })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @User() user: TUser): Promise<void> {
    return this.epciGroupsService.remove(id, user.id);
  }
}