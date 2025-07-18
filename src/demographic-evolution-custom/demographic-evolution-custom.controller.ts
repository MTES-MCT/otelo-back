import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { Role } from '@prisma/client'
import { User } from '~/common/decorators/authenticated-user'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import {
  ZCreateDemographicEvolutionCustomDto
} from '~/schemas/demographic-evolution-custom/demographic-evolution-custom';
import { TUser } from '~/schemas/users/user'
import { DemographicEvolutionCustomService } from './demographic-evolution-custom.service'

@Controller('demographic-evolution-custom')
export class DemographicEvolutionCustomController {
  constructor(private readonly demographicEvolutionCustomService: DemographicEvolutionCustomService) {
  }

  @AccessControl({
    roles: [Role.USER, Role.ADMIN],
  })
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('epciCode') epciCode: string,
    @User() {id: userId}: TUser,
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
      data,
    })

    const result = await this.demographicEvolutionCustomService.create(userId, validatedData)

    return {id: result.id}
  }
}
