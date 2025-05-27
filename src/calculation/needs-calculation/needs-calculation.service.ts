import { Inject, Injectable } from '@nestjs/common'
import { CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { DemographicEvolutionService } from '~/calculation/needs-calculation/besoins-flux/evolution-demographique-b21/demographic-evolution.service'
import { RenewalHousingStockService } from '~/calculation/needs-calculation/besoins-flux/occupation-renouvellement-parc-logements-b22/renewal-housing-stock.service'
import { NewConstructionsService } from '~/calculation/needs-calculation/new-constructions/new-constructions.service'
import { SitadelService } from '~/calculation/needs-calculation/sitadel/sitadel.service'
import { TEpciCalculationResult } from '~/schemas/calculator/calculation-result'
import { TResults } from '~/schemas/results/results'
import { StockRequirementsService } from '~/stock-requirements/stock-requirements.service'

@Injectable()
export class NeedsCalculationService {
  constructor(
    @Inject('CalculationContext')
    protected readonly context: CalculationContext,
    private readonly demographicEvolutionService: DemographicEvolutionService,
    private readonly renewalHousingStock: RenewalHousingStockService,
    private readonly stockRequirementsService: StockRequirementsService,
    private readonly sitadelService: SitadelService,
    private readonly newConstructionsService: NewConstructionsService,
  ) {}

  async calculateSitadelAndNewConstructions() {
    const [sitadel, newConstructions] = await Promise.all([this.sitadelService.calculate(), this.newConstructionsService.calculate()])
    return { sitadel, newConstructions }
  }

  async calculateFlux() {
    const [demographicEvolution, vacantAccomodationEvolution, renewalNeeds, secondaryResidenceAccomodationEvolution] = await Promise.all([
      this.demographicEvolutionService.calculate(),
      this.renewalHousingStock.getVacantAccomodationEvolution(),
      this.renewalHousingStock.calculate(),
      this.renewalHousingStock.getSecondaryResidenceAccomodationEvolution(),
    ])

    return { demographicEvolution, vacantAccomodationEvolution, renewalNeeds, secondaryResidenceAccomodationEvolution }
  }

  async calculate(): Promise<TResults> {
    const { demographicEvolution, vacantAccomodationEvolution, renewalNeeds, secondaryResidenceAccomodationEvolution } =
      await this.calculateFlux()
    const stockRequirementsNeeds = await this.stockRequirementsService.calculateStock()
    const { noAccomodation, hosted, financialInadequation, physicalInadequation, badQuality, socialParc } = stockRequirementsNeeds
    const { sitadel, newConstructions } = await this.calculateSitadelAndNewConstructions()
    let total = 0
    let totalStock = 0
    let totalFlux = 0
    console.log(newConstructions)

    const epcisTotals = this.context.simulation.epcis.map((epci) => {
      const epciTotalFlux =
        (demographicEvolution.epcis.find((e) => e.epciCode === epci.code) as TEpciCalculationResult).value +
        (secondaryResidenceAccomodationEvolution.epcis.find((e) => e.epciCode === epci.code) as TEpciCalculationResult).value +
        (vacantAccomodationEvolution.epcis.find((e) => e.epciCode === epci.code) as TEpciCalculationResult).value +
        (renewalNeeds.epcis.find((e) => e.epciCode === epci.code) as TEpciCalculationResult).value

      const epciTotalStock = this.stockRequirementsService.calculateStockByEpci(epci.code, stockRequirementsNeeds)

      total += epciTotalFlux + epciTotalStock
      totalFlux += epciTotalFlux
      totalStock += epciTotalStock

      return {
        epciCode: epci.code,
        total: epciTotalFlux + epciTotalStock,
        totalFlux: epciTotalFlux,
        totalStock: epciTotalStock,
      }
    })

    return {
      badQuality,
      demographicEvolution,
      epcisTotals,
      financialInadequation,
      hosted,
      newConstructions,
      noAccomodation,
      physicalInadequation,
      renewalNeeds,
      secondaryResidenceAccomodationEvolution,
      sitadel,
      socialParc,
      total,
      totalFlux,
      totalStock,
      vacantAccomodationEvolution,
    }
  }
}
