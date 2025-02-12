import { Inject, Injectable } from '@nestjs/common'
import { MotifB17 } from '@prisma/client'
import { BaseCalculator, CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { PrismaService } from '~/db/prisma.service'
import { TCalculationResult } from '~/schemas/calculator/calculation-result'

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

  async calculateByEpci(epciCode: string): Promise<number> {
    const keyMap = {
      [MotifB17.Tout]: 'motifs',
      [MotifB17.Env]: 'voisin',
      [MotifB17.Assis]: 'mater',
      [MotifB17.Rappr]: 'services',
      [MotifB17.Trois]: 'crea',
    }
    const { simulation } = this.context
    const type = keyMap[simulation.scenario.b17_motif]
    const socialParc = await this.getSocialParc(epciCode)

    return this.applyCoefficient(socialParc[type])
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
