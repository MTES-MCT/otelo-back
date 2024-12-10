import { Module } from '@nestjs/common'
import { CoefficientCalculationService } from '~/calculation/coefficient-calculation/coefficient-calculation.service'
import { coefficientConfig } from '~/calculation/coefficient-calculation/coefficient.config'

@Module({
  exports: [CoefficientCalculationService],
  providers: [
    {
      provide: 'COEFFICIENT_CONFIG',
      useValue: coefficientConfig,
    },
    CoefficientCalculationService,
  ],
})
export class CoefficientCalculationModule {}
