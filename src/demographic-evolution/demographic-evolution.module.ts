import { Module } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'
import { DemographicEvolutionController } from '~/demographic-evolution/demographic-evolution.controller'
import { DemographicEvolutionService } from './demographic-evolution.service'

@Module({
  controllers: [DemographicEvolutionController],
  providers: [DemographicEvolutionService, PrismaService],
})
export class DemographicEvolutionModule {}
