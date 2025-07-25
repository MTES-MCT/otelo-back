import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { Role } from '@prisma/client'
import { User } from '~/common/decorators/authenticated-user'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { ZCreateDemographicEvolutionCustomDto } from '~/schemas/demographic-evolution-custom/demographic-evolution-custom'
import { TUser } from '~/schemas/users/user'
import { DemographicEvolutionCustomService } from './demographic-evolution-custom.service'

@Controller('demographic-evolution-custom')
export class DemographicEvolutionCustomController {
  constructor(private readonly demographicEvolutionCustomService: DemographicEvolutionCustomService) {}

  @AccessControl({
    roles: [Role.USER, Role.ADMIN],
  })
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @User() { id: userId }: TUser,
    @Body('epciCode') epciCode: string,
    @Body('scenarioId') scenarioId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded')
    }

    if (!epciCode) {
      throw new BadRequestException('EPCI code is required')
    }

    // Parse the uploaded file
    const data = await this.demographicEvolutionCustomService.parseUploadedFile(file.buffer, file.mimetype)

    const validatedData = ZCreateDemographicEvolutionCustomDto.parse({
      epciCode,
      scenarioId,
      data,
    })

    const result = await this.demographicEvolutionCustomService.upsert(userId, validatedData)

    return { id: result.id }
  }

  @AccessControl({
    roles: [Role.USER, Role.ADMIN],
  })
  @Get('find-many')
  async findMany(@Query('ids') ids: string[], @User() { id: userId }: TUser) {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return []
    }

    const results = await this.demographicEvolutionCustomService.findManyByUser(ids, userId)

    return results.map((result) => ({
      id: result.id,
      epciCode: result.epciCode,
      scenarioId: result.scenarioId,
      data: result.data,
      createdAt: result.createdAt,
    }))
  }

  @AccessControl({
    roles: [Role.USER, Role.ADMIN],
  })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @User() { id: userId }: TUser) {
    const hasAccess = await this.demographicEvolutionCustomService.hasUserAccessTo(id, userId)

    if (!hasAccess) {
      throw new BadRequestException('You do not have access to delete this custom demographic evolution data')
    }

    await this.demographicEvolutionCustomService.delete(id, userId)
  }
}
