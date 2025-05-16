import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'
import { TEpci } from '~/schemas/epcis/epci'

@Injectable()
export class BadQualityService {
  constructor(private readonly prismaService: PrismaService) {}

  async getBadQualityByEpci(epciCode: string) {
    const { pppiLp, pppiPo } = await this.prismaService.badQuality_Filocom.findFirstOrThrow({
      where: { epciCode },
    })

    const filocom = pppiLp + pppiPo
    return {
      data: filocom,
    }
  }

  async getBadQuality(epcis: TEpci[]) {
    const results = await Promise.all(
      epcis.map(async (epci) => ({
        ...(await this.getBadQualityByEpci(epci.code)),
        epci,
      })),
    )

    return { badQuality: results }
  }
}
