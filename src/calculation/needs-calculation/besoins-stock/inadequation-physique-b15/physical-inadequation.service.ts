import { Inject, Injectable } from '@nestjs/common'
import { BaseCalculator, CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { HostedService } from '~/calculation/needs-calculation/besoins-stock/heberges-b12/hosted.service'
import { FinancialInadequationService } from '~/calculation/needs-calculation/besoins-stock/inadequation-financiere-b13/financial-inadequation.service'
import { BadQualityService } from '~/calculation/needs-calculation/besoins-stock/mauvaise-qualite-b14/bad-quality.service'
import { RatioCalculationService } from '~/calculation/ratio-calculation/ratio-calculation.service'
import { PrismaService } from '~/db/prisma.service'

@Injectable()
export class PhysicalInadequationService extends BaseCalculator {
  constructor(
    @Inject('CalculationContext')
    protected readonly context: CalculationContext,
    private readonly prismaService: PrismaService,
    private readonly ratioCalculationService: RatioCalculationService,
    private readonly badQualityService: BadQualityService,
    private readonly financialInadequationService: FinancialInadequationService,
    private readonly hostedService: HostedService,
  ) {
    super(context)
  }

  async getPhysicalInadequationRP(epciCode: string) {
    return this.prismaService.physicalInadequation_RP.findFirstOrThrow({
      where: { epciCode },
    })
  }

  async getPhysicalInadequationFilo(epciCode: string) {
    return this.prismaService.physicalInadequation_Filo.findFirstOrThrow({
      where: { epciCode },
    })
  }

  async calculate(): Promise<number> {
    const { simulation } = this.context
    const { epci, scenario } = simulation
    const { code: epciCode, region } = epci

    const sourceCalculators = {
      Filo: async (): Promise<number> => {
        const surocc = scenario.b15_surocc === 'Mod' ? 'leg' : 'lourde'
        return [
          (scenario.b15_proprietaire && (await this.getPhysicalInadequationFilo('epciCode'))[`surocc_${surocc}_po`]) || 0,
          (scenario.b15_loc_hors_hlm && (await this.getPhysicalInadequationFilo('epciCode'))[`surocc_${surocc}_lp`]) || 0,
        ].reduce((sum, value) => sum + (value || 0), 0)
      },
      RP: async (): Promise<number> => {
        const surocc = scenario.b15_surocc.toLowerCase()
        return [
          scenario.b15_proprietaire && (await this.getPhysicalInadequationRP(epciCode))[`nb_men_${surocc}_ppT`],
          scenario.b15_loc_hors_hlm && (await this.getPhysicalInadequationRP(epciCode))[`nb_men_${surocc}_loc_nonHLM`],
        ].reduce((sum, value) => sum + (value || 0), 0)
      },
    }

    let result = await sourceCalculators[scenario.source_b15]?.()

    result +=
      -1 * this.ratioCalculationService.getRatio25(region) * (await this.hostedService.calculate()) +
      -1 * this.ratioCalculationService.getRatio35(scenario, region) * (await this.financialInadequationService.calculate()) +
      -1 * this.ratioCalculationService.getRatio45(region) * (await this.badQualityService.calculate())

    result = (1 - scenario.b15_taux_reallocation / 100.0) * result

    return this.applyCoefficient(result)
  }
}
