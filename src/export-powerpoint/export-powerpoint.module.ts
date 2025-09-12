import { Module } from '@nestjs/common'
import { ChartGenerationModule } from '~/export-powerpoint/chart-generation/chart-generation.module'
import { PlaceholderGenerationModule } from '~/export-powerpoint/placeholder-generation/placeholder-generation.module'
import { ZipModule } from '~/export-powerpoint/zip/zip.module'
import { ExportPowerpointController } from './export-powerpoint.controller'
import { ExportPowerpointService } from './export-powerpoint.service'
import { DemographicEvolutionModule } from '~/demographic-evolution/demographic-evolution.module'

@Module({
  controllers: [ExportPowerpointController],
  providers: [ExportPowerpointService],
  exports: [ExportPowerpointService],
  imports: [ZipModule, PlaceholderGenerationModule, ChartGenerationModule, DemographicEvolutionModule],
})
export class ExportPowerpointModule {}
