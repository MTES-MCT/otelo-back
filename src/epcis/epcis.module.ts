import { Module } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'
import { EpcisController } from '~/epcis/epcis.controller'
import { EpcisService } from '~/epcis/epcis.service'
@Module({
  controllers: [EpcisController],
  exports: [EpcisService],
  providers: [EpcisService, PrismaService],
})
export class EpcisModule {}
