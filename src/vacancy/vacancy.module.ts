import { Module } from '@nestjs/common'
import { PrismaModule } from '~/db/prisma.module'
import { VacancyController } from './vacancy.controller'
import { VacancyService } from './vacancy.service'

@Module({
  controllers: [VacancyController],
  exports: [VacancyService],
  imports: [PrismaModule],
  providers: [VacancyService],
})
export class VacancyModule {}
