import { Module } from '@nestjs/common'
import { DemographicEvolutionCustomController } from './demographic-evolution-custom.controller'
import { DemographicEvolutionCustomService } from './demographic-evolution-custom.service'

@Module({
  controllers: [DemographicEvolutionCustomController],
  providers: [DemographicEvolutionCustomService],
  exports: [DemographicEvolutionCustomService],
})
export class DemographicEvolutionCustomModule {}