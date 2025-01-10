import { Module } from '@nestjs/common'
import { PrismaModule } from '~/db/prisma.module'
import { EpcisModule } from '~/epcis/epcis.module'
import { ScenariosModule } from '~/scenarios/scenarios.module'
import { SimulationsController } from './simulations.controller'
import { SimulationsService } from './simulations.service'

@Module({
  controllers: [SimulationsController],
  exports: [SimulationsService],
  imports: [EpcisModule, ScenariosModule, PrismaModule],
  providers: [SimulationsService],
})
export class SimulationsModule {}
