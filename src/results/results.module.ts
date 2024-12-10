import { Module } from '@nestjs/common'
import { CoefficientCalculationModule } from '~/calculation/coefficient-calculation/coefficient-calculation.module'
import { NeedsCalculationModule } from '~/calculation/needs-calculation/needs-calculation.module'
import { ResultsController } from '~/results/results.controller'
import { SimulationsModule } from '~/simulations/simulations.module'
import { ResultsService } from './results.service'

@Module({
  controllers: [ResultsController],
  imports: [NeedsCalculationModule, CoefficientCalculationModule, SimulationsModule],
  providers: [ResultsService],
})
export class ResultsModule {}
