import { Injectable } from '@nestjs/common'
import { Epci } from '@prisma/client'
import { PrismaService } from '~/db/prisma.service'
import { TEpci } from '~/schemas/epcis/epci'

@Injectable()
export class EpcisService {
  constructor(private readonly prisma: PrismaService) {}

  get(code: string): Promise<Epci> {
    return this.prisma.epci.findUniqueOrThrow({
      where: {
        code,
      },
    })
  }

  create(data: TEpci): Promise<Epci> {
    return this.prisma.epci.create({
      data,
    })
  }

  put(code: string, data: Partial<Epci>): Promise<Epci> {
    return this.prisma.epci.update({
      data,
      where: { code },
    })
  }

  async getByBassin(bassinName: string): Promise<Epci[]> {
    return this.prisma.epci.findMany({
      where: {
        bassinName,
      },
    })
  }

  async getBassinEpcisByEpciCode(epciCode: string): Promise<Epci[]> {
    const epci = await this.get(epciCode)

    if (!epci.bassinName) {
      return []
    }

    const epcis = await this.prisma.epci.findMany({
      where: {
        bassinName: epci.bassinName,
      },
    })

    return [...epcis.filter((e) => e.code === epciCode), ...epcis.filter((e) => e.code !== epciCode)]
  }

  async delete(code: string): Promise<void> {
    await this.prisma.epci.delete({
      where: { code },
    })
  }
}
