import { Module } from '@nestjs/common'
import { BadQualityModule } from '~/bad-quality/bad-quality.module'
import { DemographicEvolutionModule } from '~/demographic-evolution/demographic-evolution.module'
import { EpcisModule } from '~/epcis/epcis.module'
import { FilocomModule } from '~/filocom/filocom.module'
import { FinancialInadequationModule } from '~/financial-inadequation/financial-inadequation.module'
import { HostedModule } from '~/hosted/hosted.module'
import { NoAccommodationModule } from '~/no-accommodation/no-accommodation.module'
import { PhysicalInadequationModule } from '~/physical-inadequation/physical-inadequation.module'
import { RpInseeModule } from '~/rp-insee/rp-insee.module'
import { VacancyModule } from '~/vacancy/vacancy.module'
import { DataVisualisationController } from './data-visualisation.controller'
import { DataVisualisationService } from './data-visualisation.service'

@Module({
  controllers: [DataVisualisationController],
  imports: [
    DemographicEvolutionModule,
    EpcisModule,
    RpInseeModule,
    FilocomModule,
    VacancyModule,
    HostedModule,
    NoAccommodationModule,
    BadQualityModule,
    FinancialInadequationModule,
    PhysicalInadequationModule,
  ],
  providers: [DataVisualisationService],
})
export class DataVisualisationModule {}
