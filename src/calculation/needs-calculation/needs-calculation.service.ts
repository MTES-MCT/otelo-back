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
    const stockRequirementsNeeds = await this.stockRequirementsService.calculateStock()
    const flowRequirement = await this.flowRequirementService.calculate(stockRequirementsNeeds)
    const { noAccomodation, hosted, financialInadequation, physicalInadequation, badQuality } = stockRequirementsNeeds

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
      const peakYear = epciFlowRequirement.data.peakYear

      const epciTotalStock = this.stockRequirementsService.calculateProrataStockByEpci(epci.code, stockRequirementsNeeds, peakYear)
      total += epciTotalFlux + epciTotalStock.total
      totalFlux += epciTotalFlux
      totalStock += epciTotalStock.total
      if (epciFlowRequirement.totals.longTermVacantAccomodation <= 0) {
        vacantAccomodation += epciFlowRequirement.totals.longTermVacantAccomodation
      }

      return {
        epciCode: epci.code,
        total: epciTotalFlux + epciTotalStock.total,
        prepeakTotalStock: epciTotalStock.prePeakTotal,
        postpeakTotalStock: epciTotalStock.postPeakTotal,
        totalFlux: epciTotalFlux,
        totalStock: epciTotalStock.total,
        vacantAccomodation: epciFlowRequirement.totals.longTermVacantAccomodation,
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
      total,
      totalFlux,
      totalStock,
      vacantAccomodation,
    }
  }
}
