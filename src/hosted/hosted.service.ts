import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'
import { TEpci } from '~/schemas/epcis/epci'

@Injectable()
export class HostedService {
  constructor(private readonly prismaService: PrismaService) {}

  async getHostedByEpci(epciCode: string) {
    const [hostedFilocom, hostedFiness, hostedSne] = await Promise.all([
      this.prismaService.hostedFilocom.findFirst({
        where: {
          epciCode,
        },
      }),
      this.prismaService.hostedFiness.findFirst({
        where: {
          epciCode,
        },
      }),
      this.prismaService.hostedSne.findFirst({
        where: {
          epciCode,
        },
      }),
    ])
    const { value: filocom } = hostedFilocom ?? { value: 0 }
    const finess = Object.entries(hostedFiness ?? {})
      .filter(([key]) => key !== 'epciCode')
      .reduce((sum, [_, value]) => sum + (value as number), 0)
    const sne = Object.entries(hostedSne ?? {})
      .filter(([key]) => key !== 'epciCode')
      .reduce((sum, [_, value]) => sum + (value as number), 0)
    return {
      data: filocom + finess + sne,
    }
  }

  async getHosted(epcis: TEpci[]) {
    const results = await Promise.all(
      epcis.map(async (epci) => ({
        ...(await this.getHostedByEpci(epci.code)),
        epci,
      })),
    )
    return { hosted: results }
  }
}
