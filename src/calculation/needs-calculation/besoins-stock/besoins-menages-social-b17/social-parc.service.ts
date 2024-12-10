import { Inject, Injectable } from '@nestjs/common'
import { BaseCalculator, CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { PrismaService } from '~/db/prisma.service'

@Injectable()
export class SocialParcService extends BaseCalculator {
  constructor(
    @Inject('CalculationContext')
    protected readonly context: CalculationContext,
    private readonly prismaService: PrismaService,
  ) {
    super(context)
  }

  getSocialParc(epciCode: string) {
    return this.prismaService.socialParc.findFirstOrThrow({
      where: {
        epciCode,
      },
    })
  }

  async calculate(): Promise<number> {
    const { simulation } = this.context
    const { epci, scenario } = simulation
    const { code: epciCode } = epci
    const type = scenario.b17_motif

    const socialParc = await this.getSocialParc(epciCode)
    return this.applyCoefficient(socialParc[type])
  }
}
