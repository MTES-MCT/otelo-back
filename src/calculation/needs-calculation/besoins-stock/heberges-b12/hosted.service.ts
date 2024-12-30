import { Inject, Injectable } from '@nestjs/common'
import { HostedFilocom, HostedSne } from '@prisma/client'
import { BaseCalculator, CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { PrismaService } from '~/db/prisma.service'
import { TCalculationResult } from '~/schemas/calculator/calculation-result'

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

  async calculateByEpci(epciCode: string): Promise<number> {
    const { simulation } = this.context
    const { scenario } = simulation

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

  async calculate(): Promise<TCalculationResult> {
    const { simulation } = this.context
    const { epcis } = simulation

    const results = await Promise.all(
      epcis.map(async (epci) => ({
        epciCode: epci.code,
        value: await this.calculateByEpci(epci.code),
      })),
    )
    const total = results.reduce((sum, result) => sum + result.value, 0)
    return {
      epcis: results,
      total,
    }
  }
}
