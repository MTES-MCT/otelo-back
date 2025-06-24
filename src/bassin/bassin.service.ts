import { Injectable } from '@nestjs/common'
import { Bassin } from '@prisma/client'
import { PrismaService } from '~/db/prisma.service'

@Injectable()
export class BassinService {
  constructor(private readonly prismaService: PrismaService) {}

  async findByName(name: string): Promise<Bassin> {
    return this.prismaService.bassin.findUniqueOrThrow({ where: { name } })
  }

  async findByEpci(epciCode: string): Promise<Bassin> {
    return this.prismaService.bassin.findFirstOrThrow({ where: { epcis: { some: { code: epciCode } } } })
  }
}
