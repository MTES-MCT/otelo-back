import { Module } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'
import { VacancyModule } from '~/vacancy/vacancy.module'
import { AccommodationRatesController } from './accommodation-rates.controller'
import { AccommodationRatesService } from './accommodation-rates.service'

@Module({
  controllers: [AccommodationRatesController],
  exports: [AccommodationRatesService],
  imports: [VacancyModule],
  providers: [AccommodationRatesService, PrismaService],
})
export class AccommodationRatesModule {}
