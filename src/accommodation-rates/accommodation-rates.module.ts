import { Module } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'
import { AccommodationRatesController } from './accommodation-rates.controller'
import { AccommodationRatesService } from './accommodation-rates.service'

@Module({
  controllers: [AccommodationRatesController],
  exports: [AccommodationRatesService],
  providers: [AccommodationRatesService, PrismaService],
})
export class AccommodationRatesModule {}
