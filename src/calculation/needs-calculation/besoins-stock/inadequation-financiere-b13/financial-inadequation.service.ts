import { Inject, Injectable } from '@nestjs/common'
import { FinancialInadequation } from '@prisma/client'
import { BaseCalculator, CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { BadQualityService } from '~/calculation/needs-calculation/besoins-stock/mauvaise-qualite-b14/bad-quality.service'
import { RatioCalculationService } from '~/calculation/ratio-calculation/ratio-calculation.service'
import { PrismaService } from '~/db/prisma.service'

@Injectable()
export class FinancialInadequationService extends BaseCalculator {
  constructor(
    @Inject('CalculationContext')
    protected readonly context: CalculationContext,
    private readonly prismaService: PrismaService,
    private readonly ratioCalculationService: RatioCalculationService,
    private readonly badQualityService: BadQualityService,
  ) {
    super(context)
  }

  async getFinancialInadequation(epciCode: string): Promise<FinancialInadequation> {
    return this.prismaService.financialInadequation.findUniqueOrThrow({
      where: { epciCode },
    })
  }

  async calculate(): Promise<number> {
    const { simulation } = this.context
    const { epci, scenario } = simulation
    const { code: epciCode, region } = epci
    let result = 0

    let column: string = ''

    if (scenario.b13_acc) {
      column = `nbAllPlus${scenario.b13_taux_effort}AccessionPropriete`
    }

    if (scenario.b13_plp) {
      column = `nbAllPlus${scenario.b13_taux_effort}ParcLocatifPrive`
    }

    const financialInadequation = await this.getFinancialInadequation(epciCode)

    const badQuality = await this.badQualityService.calculate()

    result += financialInadequation[column]
    result += this.ratioCalculationService.getRatio43(scenario, region) * badQuality * -1
    result = (1 - scenario.b13_taux_reallocation / 100.0) * result

    return this.applyCoefficient(result)
  }
}
