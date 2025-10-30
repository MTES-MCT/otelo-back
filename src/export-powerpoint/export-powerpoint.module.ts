import { Module, forwardRef } from '@nestjs/common'
import { NeedsCalculationModule } from '~/calculation/needs-calculation/needs-calculation.module'
import { DataVisualisationModule } from '~/data-visualisation/data-visualisation.module'
import { DemographicEvolutionModule } from '~/demographic-evolution/demographic-evolution.module'
import { EpcisModule } from '~/epcis/epcis.module'
import { ChartGenerationModule } from '~/export-powerpoint/chart-generation/chart-generation.module'
import { PlaceholderGenerationModule } from '~/export-powerpoint/placeholder-generation/placeholder-generation.module'
import { ZipModule } from '~/export-powerpoint/zip/zip.module'
import { RpInseeModule } from '~/rp-insee/rp-insee.module'
import { SimulationsModule } from '~/simulations/simulations.module'
import { ExportPowerpointController } from './export-powerpoint.controller'
import { ExportPowerpointService } from './export-powerpoint.service'

@Module({
  controllers: [ExportPowerpointController],
  providers: [ExportPowerpointService],
  exports: [ExportPowerpointService],
  imports: [
    ZipModule,
    PlaceholderGenerationModule,
    ChartGenerationModule,
    DemographicEvolutionModule,
    EpcisModule,
    forwardRef(() => NeedsCalculationModule),
    forwardRef(() => SimulationsModule),
    DataVisualisationModule,
    RpInseeModule,
  ],
})
export class ExportPowerpointModule {}
