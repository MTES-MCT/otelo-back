import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { Role } from '@prisma/client'
import { User } from '~/common/decorators/authenticated-user'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { TUser } from '~/schemas/users/user'
import { TCreateDemographicEvolutionCustomDto, ZCreateDemographicEvolutionCustomDto } from '~/schemas/scenarios/demographic-evolution-custom'
import { DemographicEvolutionCustomService } from './demographic-evolution-custom.service'

@Controller('demographic-evolution-custom')
export class DemographicEvolutionCustomController {
  constructor(private readonly demographicEvolutionCustomService: DemographicEvolutionCustomService) {}

  @AccessControl({
    roles: [Role.USER, Role.ADMIN],
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() data: TCreateDemographicEvolutionCustomDto,
    @User() { id: userId }: TUser,
  ) {
    const validatedData = ZCreateDemographicEvolutionCustomDto.parse(data)
    const result = await this.demographicEvolutionCustomService.create(userId, validatedData)
    
    return { id: result.id }
  }
}
