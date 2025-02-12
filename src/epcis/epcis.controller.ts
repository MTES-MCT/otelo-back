import { Body, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Param, Post, Put } from '@nestjs/common'
import { Epci, Role } from '@prisma/client'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { EpcisService } from '~/epcis/epcis.service'
import { TEpci } from '~/schemas/epcis/epci'

@Controller('epcis')
export class EpcisController {
  constructor(private readonly epcisService: EpcisService) {}

  @AccessControl({
    roles: [Role.ADMIN, Role.USER],
  })
  @Get(':code')
  @HttpCode(HttpStatus.OK)
  async getEpci(@Param('code') code: string): Promise<Epci> {
    try {
      return await this.epcisService.get(code)
    } catch (error) {
      throw new NotFoundException(`EPCI with code ${code} not found`, { cause: error })
    }
  }

  @AccessControl({
    roles: [Role.ADMIN],
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createEpci(@Body() data: TEpci): Promise<Epci> {
    return await this.epcisService.create(data)
  }

  @AccessControl({
    paramName: 'code',
    roles: [Role.ADMIN],
  })
  @Put(':code')
  @HttpCode(HttpStatus.ACCEPTED)
  async updateEpci(@Param('code') code: string, @Body() data: Partial<Epci>): Promise<Epci> {
    try {
      return await this.epcisService.put(code, data)
    } catch (error) {
      throw new NotFoundException(`EPCI with code ${code} not found`, { cause: error })
    }
  }

  @AccessControl({
    paramName: 'code',
    roles: [Role.ADMIN],
  })
  @Delete(':code')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteEpci(@Param('code') code: string): Promise<void> {
    try {
      await this.epcisService.delete(code)
    } catch (error) {
      throw new NotFoundException(`EPCI with code ${code} not found`, { cause: error })
    }
  }

  @AccessControl({
    roles: [Role.ADMIN, Role.USER],
  })
  @Get(':epciCode/bassin')
  async getEpcisByBassin(@Param('epciCode') epciCode: string): Promise<Epci[]> {
    return this.epcisService.getBassinEpcisByEpciCode(epciCode)
  }
}
