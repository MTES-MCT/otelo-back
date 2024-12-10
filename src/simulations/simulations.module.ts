import { Module } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'
import { EpcisModule } from '~/epcis/epcis.module'
import { ScenariosModule } from '~/scenarios/scenarios.module'
import { SimulationsController } from './simulations.controller'
import { SimulationsService } from './simulations.service'

@Module({
  controllers: [SimulationsController],
  exports: [SimulationsService],
  imports: [EpcisModule, ScenariosModule],
  providers: [SimulationsService, PrismaService],
})
export class SimulationsModule {}
