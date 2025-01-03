import { Module } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'
import { VacancyController } from './vacancy.controller'
import { VacancyService } from './vacancy.service'

@Module({
  controllers: [VacancyController],
  exports: [VacancyService],
  providers: [VacancyService, PrismaService],
})
export class VacancyModule {}
