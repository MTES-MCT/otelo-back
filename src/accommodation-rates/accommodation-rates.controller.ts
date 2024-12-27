import { Controller, Get, Query } from '@nestjs/common'
import { Role } from '@prisma/client'
import { AccommodationRatesService } from '~/accommodation-rates/accommodation-rates.service'
import { AccessControl } from '~/common/decorators/control-access.decorator'

@Controller('accommodation-rates')
export class AccommodationRatesController {
  constructor(private readonly accommodationRatesService: AccommodationRatesService) {}

  @AccessControl({ roles: [Role.ADMIN, Role.USER] })
  @Get()
  async getAccommodationRates(@Query() { epciCode }: { epciCode: string }) {
    return this.accommodationRatesService.getAccommodationRates(epciCode)
  }
}
