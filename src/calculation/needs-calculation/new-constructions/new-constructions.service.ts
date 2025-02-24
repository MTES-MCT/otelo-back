import { Inject, Injectable } from '@nestjs/common'
import { BaseCalculator, CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { DemographicEvolutionService } from '~/calculation/needs-calculation/besoins-flux/evolution-demographique-b21/demographic-evolution.service'
import { RenewalHousingStockService } from '~/calculation/needs-calculation/besoins-flux/occupation-renouvellement-parc-logements-b22/renewal-housing-stock.service'
import { TChartDataResult } from '~/schemas/calculator/calculation-result'

@Injectable()
export class NewConstructionsService extends BaseCalculator {
  constructor(
    @Inject('CalculationContext')
    protected readonly context: CalculationContext,
    private readonly renewalHousingStock: RenewalHousingStockService,
    private readonly demographicEvolutionService: DemographicEvolutionService,
  ) {
    super(context)
  }

  async calculate(): Promise<TChartDataResult> {
    const { simulation } = this.context
    const { epcis } = simulation
    const results = await Promise.all(epcis.map((epci) => this.calculateByEpci(epci.code)))
    return { epcis: results }
  }

  async calculateByEpci(epciCode: string) {
    const { periodProjection } = this.context

    const secondaryResidenceAccomodationEvolution =
      (await this.renewalHousingStock.getSecondaryResidenceAccomodationEvolutionByEpci(epciCode)) / periodProjection
    const vacantAccomodationEvolution = (await this.renewalHousingStock.getVacantAccomodationEvolutionByEpci(epciCode)) / periodProjection
    const demographicEvolution = await this.demographicEvolutionService.calculateOmphaleProjectionsByYearAndEpci(epciCode, 2023)
    const data = demographicEvolution.data.map(({ value, year }) => {
      const sum = value + vacantAccomodationEvolution + secondaryResidenceAccomodationEvolution
      return {
        value: sum > 0 ? Math.round(sum) : 0,
        year,
      }
    })

    return {
      code: epciCode,
      data,
      metadata: {
        max: demographicEvolution.metadata.period.endYear,
        min: demographicEvolution.metadata.period.startYear,
      },
    }
  }
}
