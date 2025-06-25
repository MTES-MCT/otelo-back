import { Inject, Injectable } from '@nestjs/common'
import { BaseCalculator, CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import {
  DemographicEvolutionService,
  omphaleMap,
} from '~/calculation/needs-calculation/besoins-flux/evolution-demographique-b21/demographic-evolution.service'
import { RenewalHousingStockService } from '~/calculation/needs-calculation/besoins-flux/occupation-renouvellement-parc-logements-b22/renewal-housing-stock.service'
import { TNewConstructionsChartData, TNewConstructionsChartDataResult } from '~/schemas/calculator/calculation-result'
import { EOmphale, TDemographicEvolution, TGetDemographicEvolution } from '~/schemas/demographic-evolution/demographic-evolution'
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
      result[year] = Math.round(value + vacantAccomodationEvolution[year] + secondaryResidenceAccomodationEvolution[year])
    })
    return result
  }

  calculateAdditionalHousingForReplacements(totalParc: number, epciCode: string, year: number) {
    const { simulation } = this.context
    const { scenario } = simulation
    const epciScenario = scenario.epciScenarios.find((epci) => epci.epciCode === epciCode)
    const result: Record<number, number> = {}

    result[year] = totalParc * (epciScenario!.b2_tx_disparition * epciScenario!.b2_tx_restructuration)

    return result
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
      const denominator = 1 - vacantAccomodationEvolution[year] - secondaryResidenceAccomodationEvolution[year]
      result[year] = Math.round(Number(value) / denominator)
    })

    return result
  }

  calculateVacantAccommodationVariationByYear(
    accommodationVariation: Record<number, number>,
    vacantAccomodationEvolution: Record<number, number>,
  ): Record<number, number> {
    const result: Record<number, number> = {}
    const { baseYear, periodProjection } = this.context

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
  ): Record<number, number> {
    const result: Record<number, number> = {}
    const { baseYear, periodProjection } = this.context

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

  calculateParcEvolutionByYear(
    initialParc: number,
    newHousingUnitsToConstruct: Record<number, number>,
    epciCode: string,
  ): Record<number, number> {
    const { baseYear, periodProjection } = this.context
    const result: Record<number, number> = {}

    result[baseYear] = initialParc

    for (let year = baseYear + 1; year <= periodProjection; year++) {
      const previousParc = result[year - 1]

      const additionalHousingForReplacements = this.calculateAdditionalHousingForReplacements(previousParc, epciCode, year - 1)
      const housingNeeds = this.calculateHousingNeeds(additionalHousingForReplacements, newHousingUnitsToConstruct)
      const surplusHousing = this.calculateSurplusHousing(additionalHousingForReplacements, newHousingUnitsToConstruct)

      const parcChange = (housingNeeds[year - 1] || 0) - (surplusHousing[year - 1] || 0)
      result[year] = previousParc + parcChange
    }

    return result
  }

  calculateHousingNeedsAndSurplusWithEvolvingParc(
    newHousingUnitsToConstruct: Record<number, number>,
    parcEvolution: Record<number, number>,
    epciCode: string,
  ): { housingNeeds: Record<number, number>; surplusHousing: Record<number, number> } {
    const { baseYear, periodProjection } = this.context
    const housingNeeds: Record<number, number> = {}
    const surplusHousing: Record<number, number> = {}

    for (let year = baseYear; year <= periodProjection; year++) {
      const currentParc = parcEvolution[year]
      const additionalHousingForReplacements = this.calculateAdditionalHousingForReplacements(currentParc, epciCode, year)
      console.log('additionalHousingForReplacements', additionalHousingForReplacements)

      const value = additionalHousingForReplacements[year] + (newHousingUnitsToConstruct[year] || 0)

      if (value > 0) {
        housingNeeds[year] = Math.round(value)
        surplusHousing[year] = 0
      } else {
        housingNeeds[year] = 0
        surplusHousing[year] = Math.abs(value)
      }
    }

    housingNeeds[baseYear] = 0
    surplusHousing[baseYear] = 0

    return { housingNeeds, surplusHousing }
  }

  async calculateByEpci(epciCode: string): Promise<TNewConstructionsChartData> {
    const { baseYear, simulation } = this.context
    const { scenario } = simulation
    const totalParc = await this.renewalHousingStock.getFilocomFlux(epciCode)

    const stockRequirementsNeeds = await this.stockRequirementsService.calculateStock()
    const stockByEpci = await this.stockRequirementsService.calculateStockByEpci(epciCode, stockRequirementsNeeds)
    const omphale = omphaleMap[scenario.b2_scenario.toLowerCase()]

    const menagesEvolution = await this.demographicEvolutionService.getProjectionsByOmphale({
      epciCode,
      omphale,
    })

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
    const peakYear = additionalHousingUnitsForDeficitAndNewHouseholds[peakYearIndex - 1]?.year ?? 2050

    const vacantAccomodationEvolution = await this.renewalHousingStock.getVacantAccomodationEvolutionByEpciAndYear(epciCode, peakYear)
    const secondaryResidenceAccomodationEvolution = await this.renewalHousingStock.getSecondaryResidenceAccomodationEvolutionByEpciAndYear(
      epciCode,
      peakYear,
    )

    const accommodationVariation = this.calculateAccommodationVariationByYear(
      menagesEvolution,
      omphale,
      vacantAccomodationEvolution,
      secondaryResidenceAccomodationEvolution,
    )

    const vacantAccommodationVariation = this.calculateVacantAccommodationVariationByYear(
      accommodationVariation,
      vacantAccomodationEvolution,
    )

    const secondaryResidenceVariation = this.calculateSecondaryResidenceVariationByYear(
      accommodationVariation,
      secondaryResidenceAccomodationEvolution,
    )

    const newHousingUnitsToConstruct = this.calculateNewHousingUnitsToConstruct(
      additionalHousingUnitsForDeficitAndNewHouseholds,
      vacantAccommodationVariation,
      secondaryResidenceVariation,
    )

    const parcEvolution = this.calculateParcEvolutionByYear(totalParc.parctot, newHousingUnitsToConstruct, epciCode)

    const { housingNeeds, surplusHousing } = this.calculateHousingNeedsAndSurplusWithEvolvingParc(
      newHousingUnitsToConstruct,
      parcEvolution,
      epciCode,
    )

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
