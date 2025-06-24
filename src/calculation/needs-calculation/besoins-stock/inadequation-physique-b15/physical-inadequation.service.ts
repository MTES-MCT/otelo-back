import { Inject, Injectable } from '@nestjs/common'
import { BaseCalculator, CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { HostedService } from '~/calculation/needs-calculation/besoins-stock/heberges-b12/hosted.service'
import { FinancialInadequationService } from '~/calculation/needs-calculation/besoins-stock/inadequation-financiere-b13/financial-inadequation.service'
import { BadQualityService } from '~/calculation/needs-calculation/besoins-stock/mauvaise-qualite-b14/bad-quality.service'
import { RatioCalculationService } from '~/calculation/ratio-calculation/ratio-calculation.service'
import { PrismaService } from '~/db/prisma.service'
import { TCalculationResult } from '~/schemas/calculator/calculation-result'
import { TEpci } from '~/schemas/epcis/epci'

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

  async calculateByEpci(epciCode: string): Promise<number> {
    const { simulation } = this.context
    const { epcis, scenario } = simulation
    const epci = epcis.find((epci) => epci.code === epciCode) as TEpci
    const region = epci.region

    const sourceCalculators = {
      Filo: async (): Promise<number> => {
        const physicalInadequation = await this.getPhysicalInadequationFilo(epciCode)
        const surocc = scenario.b15_surocc === 'Mod' ? 'Leg' : 'Lourde'
        return [
          (scenario.b15_proprietaire && physicalInadequation[`surocc${surocc}Po`]) || 0,
          (scenario.b15_loc_hors_hlm && physicalInadequation[`surocc${surocc}Lp`]) || 0,
        ].reduce((sum, value) => sum + (value || 0), 0)
      },
      RP: async (): Promise<number> => {
        const surocc = scenario.b15_surocc
        const physicalInadequation = await this.getPhysicalInadequationRP(epciCode)
        return [
          scenario.b15_proprietaire && physicalInadequation[`nbMen${surocc}PpT`],
          scenario.b15_loc_hors_hlm && physicalInadequation[`nbMen${surocc}LocNonHLM`],
        ].reduce((sum, value) => sum + (value || 0), 0)
      },
    }

    let result = await sourceCalculators[scenario.source_b15]?.()

    result +=
      -1 * this.ratioCalculationService.getRatio25(region) * (await this.hostedService.calculateByEpci(epciCode)) +
      -1 * this.ratioCalculationService.getRatio35(scenario, region) * (await this.financialInadequationService.calculateByEpci(epciCode)) +
      -1 * this.ratioCalculationService.getRatio45(region) * (await this.badQualityService.calculateByEpci(epciCode))

    result = (1 - scenario.b15_taux_reallocation / 100.0) * result

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
