import { Inject, Injectable } from '@nestjs/common'
import { BaseCalculator, CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import {
  DemographicEvolutionService,
  omphaleMap,
} from '~/calculation/needs-calculation/besoins-flux/evolution-demographique-b21/demographic-evolution.service'
import { RenewalHousingStockService } from '~/calculation/needs-calculation/besoins-flux/occupation-renouvellement-parc-logements-b22/renewal-housing-stock.service'
import { DemographicEvolutionCustomService } from '~/demographic-evolution-custom/demographic-evolution-custom.service'
import { TFlowRequirementChartData, TFlowRequirementChartDataResult } from '~/schemas/calculator/calculation-result'
import { EOmphale, TDemographicEvolution, TGetDemographicEvolution } from '~/schemas/demographic-evolution/demographic-evolution'
import { TStockRequirementsResults } from '~/schemas/results/results'
import { TScenario } from '~/schemas/scenarios/scenario'
import { TSimulationWithEpciAndScenario } from '~/schemas/simulations/simulation'
import { StockRequirementsService } from '~/stock-requirements/stock-requirements.service'

@Injectable()
export class FlowRequirementService extends BaseCalculator<[TStockRequirementsResults], [TStockRequirementsResults]> {
  constructor(
    @Inject('CalculationContext')
    protected readonly context: CalculationContext,
    private readonly renewalHousingStock: RenewalHousingStockService,
    private readonly demographicEvolutionService: DemographicEvolutionService,
    private readonly demographicEvolutionCustomService: DemographicEvolutionCustomService,
    private readonly stockRequirementsService: StockRequirementsService,
  ) {
    super(context)
  }

  async calculate(
    simulation: TSimulationWithEpciAndScenario,
    stockRequirementsNeeds: TStockRequirementsResults,
  ): Promise<TFlowRequirementChartDataResult> {
    const { epcis } = simulation
    const results = await Promise.all(epcis.map((epci) => this.calculateByEpci(simulation, epci.code, stockRequirementsNeeds)))
    return { epcis: results }
  }

  calculateAdditionalHousingUnitsForDeficitReduction(
    additionalHousingUnitsForNewHouseholds: TDemographicEvolution,
    stockByEpci: number,
    horizon: number,
  ) {
    const { baseYear } = this.context
    const result: Record<number, number> = {}
    additionalHousingUnitsForNewHouseholds.data.forEach(({ year }) => {
      if (year > horizon) {
        result[year] = 0
      } else {
        const calculation = stockByEpci / (horizon - baseYear)
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
      const vacantSecondary = Math.abs(vacantAccomodationEvolution[year] + secondaryResidenceAccomodationEvolution[year])
      if (vacantSecondary > value) {
        result[year] = 0
      } else {
        result[year] = Math.round(value + vacantAccomodationEvolution[year] + secondaryResidenceAccomodationEvolution[year])
      }
    })
    return result
  }

  calculateAdditionalHousingForReplacements(scenario: TScenario, totalParc: number, epciCode: string) {
    const epciScenario = scenario.epciScenarios.find((epci) => epci.epciCode === epciCode)
    return totalParc * (epciScenario!.b2_tx_disparition - epciScenario!.b2_tx_restructuration)
  }

  calculateHousingNeeds(additionalHousingForReplacements: Record<number, number>, newHousingUnitsToConstruct: Record<number, number>) {
    const { baseYear } = this.context
    const result: Record<number, number> = {}
    Object.keys(additionalHousingForReplacements).forEach((year) => {
      const value = additionalHousingForReplacements[year] + newHousingUnitsToConstruct[year]
      result[year] = value > 0 ? Math.round(value) : 0
    })
    result[baseYear] = 0
    return result
  }

  calculateSurplusHousing(additionalHousingForReplacements: Record<number, number>, newHousingUnitsToConstruct: Record<number, number>) {
    const { baseYear } = this.context
    const result: Record<number, number> = {}
    Object.keys(additionalHousingForReplacements).forEach((year) => {
      const value = additionalHousingForReplacements[year] + newHousingUnitsToConstruct[year]
      result[year] = value < 0 ? Math.abs(value) : 0
    })
    result[baseYear] = 0
    return result
  }

  calculateAccommodationVariationByYear(
    menagesEvolution: TGetDemographicEvolution[],
    omphale: EOmphale,
    vacantAccomodationEvolution: Record<number, number>,
    secondaryResidenceAccomodationEvolution: Record<number, number>,
  ): Record<number, number> {
    const result: Record<number, number> = {}
    menagesEvolution.forEach(({ year, [omphale]: value }) => {
      // let cumulativeDeficitReduction = 0
      // for (let currentYear = 2022; currentYear <= year; currentYear++) {
      //   cumulativeDeficitReduction += additionalHousingUnitsForDeficitReduction[currentYear] || 0
      // }

      const denominator = 1 - vacantAccomodationEvolution[year] - secondaryResidenceAccomodationEvolution[year]
      result[year] = Math.round(Number(value) / denominator)
    })

    return result
  }

  calculateVacantAccommodationVariationByYear(
    accommodationVariation: Record<number, number>,
    vacantAccomodationEvolution: Record<number, number>,
    periodProjection: number,
  ): Record<number, number> {
    const result: Record<number, number> = {}
    const { baseYear } = this.context

    for (let year = baseYear; year <= periodProjection; year++) {
      if (year === baseYear) {
        result[year] = Math.round(accommodationVariation[year] * vacantAccomodationEvolution[year])
      } else {
        const previousAccommodation = accommodationVariation[year - 1] || 0
        const currentVacancyRate = vacantAccomodationEvolution[year]
        const previousVacancyRate = vacantAccomodationEvolution[year - 1] || vacantAccomodationEvolution[year]

        result[year] = Math.round(accommodationVariation[year] * currentVacancyRate - previousAccommodation * previousVacancyRate)
      }
    }

    return result
  }

  calculateSecondaryResidenceVariationByYear(
    accommodationVariation: Record<number, number>,
    secondaryResidenceAccomodationEvolution: Record<number, number>,
    periodProjection: number,
  ): Record<number, number> {
    const result: Record<number, number> = {}
    const { baseYear } = this.context

    for (let year = baseYear; year <= periodProjection; year++) {
      if (year === baseYear) {
        result[year] = Math.round(accommodationVariation[year] * secondaryResidenceAccomodationEvolution[year])
      } else {
        const previousAccommodation = accommodationVariation[year - 1] || 0
        const currentSecondaryResidenceRate = secondaryResidenceAccomodationEvolution[year]
        const previousSecondaryResidenceRate =
          secondaryResidenceAccomodationEvolution[year - 1] || secondaryResidenceAccomodationEvolution[year]

        result[year] = Math.round(
          accommodationVariation[year] * currentSecondaryResidenceRate - previousAccommodation * previousSecondaryResidenceRate,
        )
      }
    }

    return result
  }

  calculateParcEvolutionAndNeedsSequential(
    simulation: TSimulationWithEpciAndScenario,
    initialParc: number,
    newHousingUnitsToConstruct: Record<number, number>,
    additionalHousingUnitsForDeficitAndNewHouseholds: Array<{ year: number; value: number }>,
    epciCode: string,
    peakYear: number,
  ): {
    parcEvolution: Record<number, number>
    housingNeeds: Record<number, number>
    surplusHousing: Record<number, number>
    additionalHousingForReplacements: Record<number, number>
  } {
    const { baseYear } = this.context
    const periodProjection = simulation.scenario.projection

    const parcEvolution: Record<number, number> = {}
    const housingNeeds: Record<number, number> = {}
    const surplusHousing: Record<number, number> = {}
    const additionalHousingForReplacements: Record<number, number> = {}

    parcEvolution[baseYear] = initialParc
    housingNeeds[baseYear] = 0
    surplusHousing[baseYear] = 0
    additionalHousingForReplacements[baseYear] = 0

    for (let year = baseYear + 1; year <= periodProjection; year++) {
      const previousParc = parcEvolution[year - 1]
      additionalHousingForReplacements[year] = this.calculateAdditionalHousingForReplacements(simulation.scenario, previousParc, epciCode)
      let totalValue
      if (year <= peakYear) {
        totalValue = additionalHousingForReplacements[year] + (newHousingUnitsToConstruct[year] || 0)
      } else {
        totalValue =
          additionalHousingForReplacements[year] +
          (additionalHousingUnitsForDeficitAndNewHouseholds.find(({ year: y }) => y === year)?.value || 0)
      }
      if (totalValue > 0) {
        housingNeeds[year] = Math.round(totalValue)
        surplusHousing[year] = 0
      } else {
        housingNeeds[year] = 0
        surplusHousing[year] = Math.abs(Math.round(totalValue))
      }

      const netChange = housingNeeds[year] - surplusHousing[year]
      parcEvolution[year] = Math.max(0, previousParc + netChange)
    }

    return { parcEvolution, housingNeeds, surplusHousing, additionalHousingForReplacements }
  }

  formatDemographicEvolutionCustom(
    demographicEvolutionCustom: NonNullable<Awaited<ReturnType<DemographicEvolutionCustomService['findFirstByScenarioAndEpci']>>>,
    omphale: EOmphale,
  ): TGetDemographicEvolution[] {
    const data = demographicEvolutionCustom.data as Array<{ year: number; value: number }>

    return data.map(({ year, value }) => ({
      epciCode: demographicEvolutionCustom.epciCode,
      [omphale]: value,
      year,
    }))
  }

  async getEpciMenageEvolution(
    epciCode: string,
    scenarioId: string,
    scenarioProjection: number,
    omphale: EOmphale,
  ): Promise<TGetDemographicEvolution[]> {
    let menagesEvolution: TGetDemographicEvolution[] = []

    const demographicEvolutionCustom = await this.demographicEvolutionCustomService.findFirstByScenarioAndEpci(scenarioId, epciCode)
    if (demographicEvolutionCustom) {
      menagesEvolution = this.formatDemographicEvolutionCustom(demographicEvolutionCustom, omphale)
    }

    if (!demographicEvolutionCustom) {
      menagesEvolution = await this.demographicEvolutionService.getProjectionsByOmphale(
        {
          epciCode,
          omphale,
        },
        scenarioProjection,
      )
    }

    return menagesEvolution
  }

  async calculateByEpci(
    simulation: TSimulationWithEpciAndScenario,
    epciCode: string,
    stockRequirementsNeeds: TStockRequirementsResults,
  ): Promise<TFlowRequirementChartData> {
    const { baseYear } = this.context
    const { scenario } = simulation
    const totalParc = await this.renewalHousingStock.getFilocomFlux(epciCode)
    const stockByEpci = this.stockRequirementsService.calculateStockByEpci(epciCode, stockRequirementsNeeds)

    const omphale = omphaleMap[scenario.b2_scenario.toLowerCase()]

    const menagesEvolution = await this.getEpciMenageEvolution(epciCode, scenario.id, scenario.projection, omphale)

    // We want to get value from 2021, so we start the calculation one year before, i.e. 2020
    const additionalHousingUnitsForNewHouseholds = await this.demographicEvolutionService.calculateOmphaleProjectionsByYearAndEpci(
      simulation,
      epciCode,
      baseYear - 1,
    )

    const additionalHousingUnitsForDeficitReduction = this.calculateAdditionalHousingUnitsForDeficitReduction(
      additionalHousingUnitsForNewHouseholds,
      stockByEpci,
      simulation.scenario.b1_horizon_resorption,
    )

    const additionalHousingUnitsForDeficitAndNewHouseholds = this.calculateAdditionalHousingUnitsForDeficitAndNewHouseholds(
      additionalHousingUnitsForNewHouseholds,
      additionalHousingUnitsForDeficitReduction,
    )

    // Calculate the year just before we pass from positive to negative
    const peakYearIndex = additionalHousingUnitsForDeficitAndNewHouseholds.findIndex(({ value }) => value < 0)
    let peakYear = additionalHousingUnitsForDeficitAndNewHouseholds[peakYearIndex - 1]?.year ?? 2050
    if (peakYear < baseYear) {
      peakYear = 2050
    }

    const vacantAccomodationEvolution = await this.renewalHousingStock.getVacantAccomodationEvolutionByEpciAndYear(
      scenario,
      epciCode,
      peakYear,
    )
    const shortTermVacantAccomodationEvolution = await this.renewalHousingStock.getVacantAccomodationEvolutionByEpciAndYear(
      scenario,
      epciCode,
      peakYear,
      'short',
    )
    const longTermVacantAccomodationEvolution = await this.renewalHousingStock.getVacantAccomodationEvolutionByEpciAndYear(
      scenario,
      epciCode,
      peakYear,
      'long',
    )

    const secondaryResidenceAccomodationEvolution = await this.renewalHousingStock.getSecondaryResidenceAccomodationEvolutionByEpciAndYear(
      simulation,
      epciCode,
      peakYear,
    )

    const accommodationVariationEvolution = this.calculateAccommodationVariationByYear(
      // we dont want to use the cumulative deficit reduction for now but i keep it if needed
      // additionalHousingUnitsForDeficitReduction,
      menagesEvolution,
      omphale,
      vacantAccomodationEvolution,
      secondaryResidenceAccomodationEvolution,
    )

    const vacantAccommodationVariation = this.calculateVacantAccommodationVariationByYear(
      accommodationVariationEvolution,
      vacantAccomodationEvolution,
      simulation.scenario.projection,
    )
    const shortTermVacantAccomodationVariation = this.calculateVacantAccommodationVariationByYear(
      accommodationVariationEvolution,
      shortTermVacantAccomodationEvolution,
      simulation.scenario.projection,
    )
    const longTermVacantAccomodationVariation = this.calculateVacantAccommodationVariationByYear(
      accommodationVariationEvolution,
      longTermVacantAccomodationEvolution,
      simulation.scenario.projection,
    )
    const secondaryResidenceVariation = this.calculateSecondaryResidenceVariationByYear(
      accommodationVariationEvolution,
      secondaryResidenceAccomodationEvolution,
      simulation.scenario.projection,
    )
    const newHousingUnitsToConstruct = this.calculateNewHousingUnitsToConstruct(
      additionalHousingUnitsForDeficitAndNewHouseholds,
      vacantAccommodationVariation,
      secondaryResidenceVariation,
    )
    const { parcEvolution, housingNeeds, surplusHousing, additionalHousingForReplacements } = this.calculateParcEvolutionAndNeedsSequential(
      simulation,
      totalParc.parctot,
      newHousingUnitsToConstruct,
      additionalHousingUnitsForDeficitAndNewHouseholds,
      epciCode,
      peakYear,
    )

    const demographicEvolutionTotal = additionalHousingUnitsForNewHouseholds.data
      .filter(({ year }) => year <= peakYear && year > baseYear)
      .reduce((sum, { value }) => sum + value, 0)
    const renewalNeedsTotal = Object.entries(additionalHousingForReplacements)
      .filter(([year]) => Number(year) <= peakYear && Number(year) > baseYear)
      .reduce((sum, [, value]) => sum + value, 0)
    const secondaryResidenceTotal = Object.entries(secondaryResidenceVariation)
      .filter(([year]) => Number(year) <= peakYear && Number(year) > baseYear)
      .reduce((sum, [, value]) => sum + value, 0)
    const housingNeedsTotal = Object.entries(housingNeeds)
      .filter(([year]) => Number(year) <= peakYear && Number(year) > baseYear)
      .reduce((sum, [, value]) => sum + value, 0)
    const surplusHousingTotal = Object.entries(surplusHousing).reduce((sum, [, value]) => sum + value, 0)
    const vacantAccomodationTotal = Object.entries(vacantAccommodationVariation)
      .filter(([year]) => Number(year) <= peakYear && Number(year) > baseYear)
      .reduce((sum, [, value]) => sum + value, 0)
    const shortTermVacantAccomodationTotal = Object.entries(shortTermVacantAccomodationVariation)
      .filter(([year]) => Number(year) <= peakYear && Number(year) > baseYear)
      .reduce((sum, [, value]) => sum + value, 0)
    const longTermVacantAccomodationTotal = Object.entries(longTermVacantAccomodationVariation)
      .filter(([year]) => Number(year) <= peakYear && Number(year) > baseYear)
      .reduce((sum, [, value]) => sum + value, 0)

    return {
      code: epciCode,
      data: {
        peakYear,
        parcEvolution,
        housingNeeds,
        surplusHousing,
      },
      totals: {
        demographicEvolution: Math.round(demographicEvolutionTotal),
        renewalNeeds: Math.round(renewalNeedsTotal),
        secondaryResidenceAccomodationEvolution: Math.round(secondaryResidenceTotal),
        housingNeeds: Math.round(housingNeedsTotal),
        surplusHousing: Math.round(surplusHousingTotal),
        vacantAccomodation: Math.round(vacantAccomodationTotal),
        shortTermVacantAccomodation: Math.round(shortTermVacantAccomodationTotal),
        longTermVacantAccomodation: Math.round(longTermVacantAccomodationTotal),
      },
      metadata: {
        max: additionalHousingUnitsForNewHouseholds.metadata.period.endYear,
        min: additionalHousingUnitsForNewHouseholds.metadata.period.startYear,
      },
    }
  }
}
