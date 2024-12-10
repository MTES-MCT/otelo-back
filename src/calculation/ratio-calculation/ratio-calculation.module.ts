import { Module } from '@nestjs/common'
import { RatioCalculationService } from '~/calculation/ratio-calculation/ratio-calculation.service'
import { ratioConfig } from '~/calculation/ratio-calculation/ratio.config'

@Module({
  exports: [RatioCalculationService],
  providers: [
    {
      provide: 'RATIO_CONFIG',
      useValue: ratioConfig,
    },
    RatioCalculationService,
  ],
})
export class RatioCalculationModule {}
