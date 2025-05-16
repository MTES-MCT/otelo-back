import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'
import { TEpci } from '~/schemas/epcis/epci'

@Injectable()
export class HostedService {
  constructor(private readonly prismaService: PrismaService) {}

  async getHostedByEpci(epciCode: string) {
    const [hostedFilocom, hostedFiness, hostedSne] = await Promise.all([
      this.prismaService.hostedFilocom.findFirstOrThrow({
        where: {
          epciCode,
        },
      }),
      this.prismaService.hostedFiness.findFirstOrThrow({
        where: {
          epciCode,
        },
      }),
      this.prismaService.hostedSne.findFirstOrThrow({
        where: {
          epciCode,
        },
      }),
    ])
    const { value: filocom } = hostedFilocom
    const finess =
      hostedFiness.autreCentre +
      hostedFiness.centreProvisoire +
      hostedFiness.demandeAsile +
      hostedFiness.foyerMigrants +
      hostedFiness.horsMaisonRelai +
      hostedFiness.jeuneTravailleur +
      hostedFiness.maisonRelai +
      hostedFiness.malade +
      hostedFiness.reinsertion
    const sne = hostedSne.free + hostedSne.particular + hostedSne.temporary
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
