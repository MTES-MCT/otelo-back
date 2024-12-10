import { Module } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'
import { UsersService } from '~/users/users.service'
import { UsersController } from './users.controller'

@Module({
  controllers: [UsersController],
  exports: [UsersService],
  providers: [UsersService, PrismaService],
})
export class UsersModule {}
