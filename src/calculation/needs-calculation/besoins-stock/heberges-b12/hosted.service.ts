import { Inject, Injectable } from '@nestjs/common'
import { HostedFilocom, HostedSne } from '@prisma/client'
import { BaseCalculator, CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { PrismaService } from '~/db/prisma.service'

@Injectable()
export class HostedService extends BaseCalculator {
  constructor(
    @Inject('CalculationContext')
    protected readonly context: CalculationContext,
    private readonly prismaService: PrismaService,
  ) {
    super(context)
  }

  async getHostedFilocom(epciCode: string): Promise<HostedFilocom> {
    return this.prismaService.hostedFilocom.findFirstOrThrow({
      where: {
        epciCode,
      },
    })
  }

  async getHostedSne(epciCode: string): Promise<HostedSne> {
    return this.prismaService.hostedSne.findFirstOrThrow({
      where: {
        epciCode,
      },
    })
  }

  async calculate(): Promise<number> {
    const { simulation } = this.context
    const { epci, scenario } = simulation
    const { code: epciCode } = epci

    const hostedFilocom = await this.getHostedFilocom(epciCode)

    let result = (scenario.b12_cohab_interg_subie / 100) * hostedFilocom.value

    const { free, particular, temporary } = await this.getHostedSne(epciCode)
    if (scenario.b12_heberg_particulier) {
      result += particular
    }

    if (scenario.b12_heberg_gratuit) {
      result += free
    }

    if (scenario.b12_heberg_temporaire) {
      result += temporary
    }

    return this.applyCoefficient(result)
  }
}
