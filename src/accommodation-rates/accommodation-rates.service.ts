import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'

@Injectable()
export class AccommodationRatesService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAccommodationRates(epciCode: string) {
    const data = await this.prismaService.filocomFlux.findFirstOrThrow({
      where: {
        epciCode,
      },
    })
    return {
      txLv: data.txLvParctot,
      txRs: data.txRsParctot,
    }
  }
}
