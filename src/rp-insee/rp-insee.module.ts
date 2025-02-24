import { Module } from '@nestjs/common'
import { PrismaModule } from '~/db/prisma.module'
import { RpInseeController } from './rp-insee.controller'
import { RpInseeService } from './rp-insee.service'

@Module({
  controllers: [RpInseeController],
  exports: [RpInseeService],
  imports: [PrismaModule],
  providers: [RpInseeService],
})
export class RpInseeModule {}
