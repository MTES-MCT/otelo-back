import { Module } from '@nestjs/common'
import { PrismaModule } from '~/db/prisma.module'
import { VacancyModule } from '~/vacancy/vacancy.module'
import { AccommodationRatesController } from './accommodation-rates.controller'
import { AccommodationRatesService } from './accommodation-rates.service'

@Module({
  controllers: [AccommodationRatesController],
  exports: [AccommodationRatesService],
  imports: [VacancyModule, PrismaModule],
  providers: [AccommodationRatesService],
})
export class AccommodationRatesModule {}
