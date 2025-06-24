import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { EmailService } from './email.service'

@Module({
  imports: [ConfigModule, HttpModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
