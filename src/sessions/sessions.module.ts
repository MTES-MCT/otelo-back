import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PrismaService } from '~/db/prisma.service'
import { UsersModule } from '~/users/users.module'
import { SessionsService } from './sessions.service'

@Module({
  exports: [SessionsService],
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { algorithm: 'HS256' },
    }),
    UsersModule,
  ],
  providers: [SessionsService, PrismaService],
})
export class SessionsModule {}
