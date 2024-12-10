import { Module } from '@nestjs/common'
import { ScenariosController } from './scenarios.controller'
import { ScenariosService } from './scenarios.service'
import { PrismaService } from '~/db/prisma.service'

@Module({
  controllers: [ScenariosController],
  exports: [ScenariosService],
  providers: [ScenariosService, PrismaService],
})
export class ScenariosModule {}
