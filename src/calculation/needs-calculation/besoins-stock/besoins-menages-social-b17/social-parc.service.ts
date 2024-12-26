import { Inject, Injectable } from '@nestjs/common'
import { MotifB17 } from '@prisma/client'
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
    const keyMap = {
      [MotifB17.Tout]: 'motifs',
      [MotifB17.Env]: 'voisin',
      [MotifB17.Assis]: 'mater',
      [MotifB17.Rappr]: 'services',
      [MotifB17.Trois]: 'crea',
    }
    const { simulation } = this.context
    const { epci, scenario } = simulation
    const { code: epciCode } = epci
    const type = keyMap[scenario.b17_motif]
    const socialParc = await this.getSocialParc(epciCode)

    return this.applyCoefficient(socialParc[type])
  }
}
