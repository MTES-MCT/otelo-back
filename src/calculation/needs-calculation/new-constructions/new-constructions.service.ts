import { Inject, Injectable } from '@nestjs/common'
import { BaseCalculator, CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { DemographicEvolutionService } from '~/calculation/needs-calculation/besoins-flux/evolution-demographique-b21/demographic-evolution.service'
import { RenewalHousingStockService } from '~/calculation/needs-calculation/besoins-flux/occupation-renouvellement-parc-logements-b22/renewal-housing-stock.service'
import { TNewConstructionsChartData, TNewConstructionsChartDataResult } from '~/schemas/calculator/calculation-result'
import { TDemographicEvolution } from '~/schemas/demographic-evolution/demographic-evolution'
import { StockRequirementsService } from '~/stock-requirements/stock-requirements.service'

@Injectable()
export class NewConstructionsService extends BaseCalculator {
  constructor(
    @Inject('CalculationContext')
    protected readonly context: CalculationContext,
    private readonly renewalHousingStock: RenewalHousingStockService,
    private readonly demographicEvolutionService: DemographicEvolutionService,
    private readonly stockRequirementsService: StockRequirementsService,
  ) {
    super(context)
  }

  async calculate(): Promise<TNewConstructionsChartDataResult> {
    const { simulation } = this.context
    const { epcis } = simulation
    const results = await Promise.all(epcis.map((epci) => this.calculateByEpci(epci.code)))
    return { epcis: results }
  }

  calculateAdditionalHousingUnitsForDeficitReduction(additionalHousingUnitsForNewHouseholds: TDemographicEvolution, stockByEpci: number) {
    const { simulation, baseYear } = this.context
    const { scenario } = simulation
    const { b1_horizon_resorption } = scenario
    const result: Record<number, number> = {}
    additionalHousingUnitsForNewHouseholds.data.forEach(({ year }) => {
      if (year >= b1_horizon_resorption) {
        result[year] = 0
      } else {
        const calculation = stockByEpci / (b1_horizon_resorption - baseYear)
        result[year] = isFinite(calculation) ? Math.round(calculation) : 0
      }
    })

    return result
  }

  calculateAdditionalHousingUnitsForDeficitAndNewHouseholds(
    additionalHousingUnitsForNewHouseholds: TDemographicEvolution,
    additionalHousingUnitsForDeficitReduction: Record<number, number>,
  ) {
    return additionalHousingUnitsForNewHouseholds.data.map(({ year, value }) => {
      return { year, value: value + additionalHousingUnitsForDeficitReduction[year] }
    })
  }

  calculateNewHousingUnitsToConstruct(
    additionalHousingUnitsForDeficitAndNewHouseholds: Array<{ year: number; value: number }>,
    vacantAccomodationEvolution: Record<number, number>,
    secondaryResidenceAccomodationEvolution: Record<number, number>,
  ) {
    const result: Record<number, number> = {}
    additionalHousingUnitsForDeficitAndNewHouseholds.forEach(({ year, value }) => {
      result[year] = Math.round(value / (1 - vacantAccomodationEvolution[year] - secondaryResidenceAccomodationEvolution[year]))
    })
    return result
  }

  calculateAdditionalHousingForReplacements(totalParc: number, epciCode: string) {
    const { simulation, baseYear, periodProjection } = this.context
    const { scenario } = simulation
    const epciScenario = scenario.epciScenarios.find((epci) => epci.epciCode === epciCode)
    const result: Record<number, number> = {}

    for (let year = baseYear; year <= periodProjection; year++) {
      result[year] = totalParc * (epciScenario!.b2_tx_disparition - totalParc * epciScenario!.b2_tx_restructuration)
    }

    return result
  }

  calculateHousingNeeds(additionalHousingForReplacements: Record<number, number>, newHousingUnitsToConstruct: Record<number, number>) {
    const result: Record<number, number> = {}
    Object.keys(additionalHousingForReplacements).forEach((year) => {
      const value = additionalHousingForReplacements[year] + newHousingUnitsToConstruct[year]
      result[year] = value > 0 ? Math.round(value) : 0
    })
    return result
  }

  calculateSurplusHousing(additionalHousingForReplacements: Record<number, number>, newHousingUnitsToConstruct: Record<number, number>) {
    const result: Record<number, number> = {}
    Object.keys(additionalHousingForReplacements).forEach((year) => {
      const value = additionalHousingForReplacements[year] + newHousingUnitsToConstruct[year]
      result[year] = value < 0 ? Math.abs(value) : 0
    })
    return result
  }

  async calculateByEpci(epciCode: string): Promise<TNewConstructionsChartData> {
    const { baseYear } = this.context
    const totalParc = await this.renewalHousingStock.getFilocomFlux(epciCode)

    const stockRequirementsNeeds = await this.stockRequirementsService.calculateStock()
    const stockByEpci = await this.stockRequirementsService.calculateStockByEpci(epciCode, stockRequirementsNeeds)

    // We want to get value from 2021, so we start the calculation one year before, i.e. 2020
    const additionalHousingUnitsForNewHouseholds = await this.demographicEvolutionService.calculateOmphaleProjectionsByYearAndEpci(
      epciCode,
      baseYear - 1,
    )
    const additionalHousingUnitsForDeficitReduction = this.calculateAdditionalHousingUnitsForDeficitReduction(
      additionalHousingUnitsForNewHouseholds,
      stockByEpci,
    )
    const additionalHousingUnitsForDeficitAndNewHouseholds = this.calculateAdditionalHousingUnitsForDeficitAndNewHouseholds(
      additionalHousingUnitsForNewHouseholds,
      additionalHousingUnitsForDeficitReduction,
    )

    // Calculate the year just before we pass from positive to negative
    const peakYearIndex = additionalHousingUnitsForDeficitAndNewHouseholds.findIndex(({ value }) => value < 0)
    const peakYear = additionalHousingUnitsForDeficitAndNewHouseholds[peakYearIndex - 1].year

    const vacantAccomodationEvolution = await this.renewalHousingStock.getVacantAccomodationEvolutionByEpciAndYear(epciCode, peakYear)
    const secondaryResidenceAccomodationEvolution = await this.renewalHousingStock.getSecondaryResidenceAccomodationEvolutionByEpciAndYear(
      epciCode,
      peakYear,
    )
    const newHousingUnitsToConstruct = this.calculateNewHousingUnitsToConstruct(
      additionalHousingUnitsForDeficitAndNewHouseholds,
      vacantAccomodationEvolution,
      secondaryResidenceAccomodationEvolution,
    )
    const additionalHousingForReplacements = this.calculateAdditionalHousingForReplacements(totalParc.parctot, epciCode)
    const housingNeeds = this.calculateHousingNeeds(newHousingUnitsToConstruct, additionalHousingForReplacements)
    const surplusHousing = this.calculateSurplusHousing(newHousingUnitsToConstruct, additionalHousingForReplacements)

    return {
      code: epciCode,
      data: {
        housingNeeds,
        surplusHousing,
      },
      metadata: {
        max: additionalHousingUnitsForNewHouseholds.metadata.period.endYear,
        min: additionalHousingUnitsForNewHouseholds.metadata.period.startYear,
      },
    }
  }
}
