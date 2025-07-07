import { Inject, Injectable } from '@nestjs/common'
import { CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { FlowRequirementService } from '~/calculation/needs-calculation/besoins-flux/flow-requirement.service'
import { SitadelService } from '~/calculation/needs-calculation/sitadel/sitadel.service'
import { TFlowRequirementChartData } from '~/schemas/calculator/calculation-result'
import { TResults } from '~/schemas/results/results'
import { StockRequirementsService } from '~/stock-requirements/stock-requirements.service'

@Injectable()
export class NeedsCalculationService {
  constructor(
    @Inject('CalculationContext')
    protected readonly context: CalculationContext,
    private readonly flowRequirementService: FlowRequirementService,
    private readonly stockRequirementsService: StockRequirementsService,
    private readonly sitadelService: SitadelService,
  ) {}

  async calculate(): Promise<TResults> {
    const flowRequirement = await this.flowRequirementService.calculate()
    const stockRequirementsNeeds = await this.stockRequirementsService.calculateStock()
    const { noAccomodation, hosted, financialInadequation, physicalInadequation, badQuality, socialParc } = stockRequirementsNeeds
    const sitadel = await this.sitadelService.calculate()
    let total = 0
    let totalStock = 0
    let totalFlux = 0
    let vacantAccomodation = 0
    const epcisTotals = this.context.simulation.epcis.map((epci) => {
      const epciFlowRequirement = flowRequirement.epcis.find((e) => e.code === epci.code) as TFlowRequirementChartData
      const epciTotalFlux =
        epciFlowRequirement.totals.demographicEvolution +
        epciFlowRequirement.totals.renewalNeeds +
        epciFlowRequirement.totals.secondaryResidenceAccomodationEvolution +
        epciFlowRequirement.totals.vacantAccomodation

      const epciTotalStock = this.stockRequirementsService.calculateStockByEpci(epci.code, stockRequirementsNeeds)

      total += epciTotalFlux + epciTotalStock
      totalFlux += epciTotalFlux
      totalStock += epciTotalStock
      vacantAccomodation += epciFlowRequirement.totals.vacantAccomodation

      return {
        epciCode: epci.code,
        total: epciTotalFlux + epciTotalStock,
        totalFlux: epciTotalFlux,
        totalStock: epciTotalStock,
      }
    })

    return {
      badQuality,
      flowRequirement,
      epcisTotals,
      financialInadequation,
      hosted,
      noAccomodation,
      physicalInadequation,
      sitadel,
      socialParc,
      total,
      totalFlux,
      totalStock,
      vacantAccomodation,
    }
  }
}
