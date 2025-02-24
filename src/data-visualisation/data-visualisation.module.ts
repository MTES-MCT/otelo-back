import { Module } from '@nestjs/common'
import { DemographicEvolutionModule } from '~/demographic-evolution/demographic-evolution.module'
import { EpcisModule } from '~/epcis/epcis.module'
import { RpInseeModule } from '~/rp-insee/rp-insee.module'
import { DataVisualisationController } from './data-visualisation.controller'
import { DataVisualisationService } from './data-visualisation.service'

@Module({
  controllers: [DataVisualisationController],
  imports: [DemographicEvolutionModule, EpcisModule, RpInseeModule],
  providers: [DataVisualisationService],
})
export class DataVisualisationModule {}
