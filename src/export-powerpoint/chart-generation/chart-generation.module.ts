import { Module } from '@nestjs/common'
import { PlaceholderGenerationModule } from '~/export-powerpoint/placeholder-generation/placeholder-generation.module'
import { ChartGenerationService } from './chart-generation.service'

@Module({
  providers: [ChartGenerationService],
  exports: [ChartGenerationService],
})
export class ChartGenerationModule {}
