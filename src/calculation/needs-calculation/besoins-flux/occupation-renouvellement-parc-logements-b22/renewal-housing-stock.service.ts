import { Inject, Injectable } from '@nestjs/common'
import { FilocomFlux } from '@prisma/client'
import { AccommodationRatesService } from '~/accommodation-rates/accommodation-rates.service'
import { CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { PrismaService } from '~/db/prisma.service'

@Injectable()
export class RenewalHousingStockService {
  constructor(
    @Inject('CalculationContext')
    protected readonly context: CalculationContext,
    private readonly prismaService: PrismaService,
    private readonly accommodationRatesService: AccommodationRatesService,
  ) {}

  async getFilocomFlux(epciCode: string): Promise<FilocomFlux> {
    return this.prismaService.filocomFlux.findFirstOrThrow({
      where: {
        epciCode,
      },
    })
  }

  private async getVacantAccommodationRate(
    defaultVacancyRate: number,
    epciCode: string,
    type: 'short' | 'long' | 'total' = 'total',
  ): Promise<number> {
    const { simulation } = this.context
    const { scenario } = simulation
    const epciScenario = scenario.epciScenarios.find((epci) => epci.epciCode === epciCode)
    const shortTermRate = epciScenario?.b2_tx_vacance_courte ?? defaultVacancyRate
    const longTermRate = epciScenario?.b2_tx_vacance_longue ?? defaultVacancyRate

    switch (type) {
      case 'short':
        return shortTermRate || defaultVacancyRate
      case 'long':
        return longTermRate || defaultVacancyRate
      case 'total':
      default:
        return shortTermRate + longTermRate || defaultVacancyRate
    }
  }

  private getSecondaryResidenceRate(defaultSecondaryResidenceRate: number, epciCode: string): number {
    const { simulation } = this.context
    const { scenario } = simulation
    const epciScenario = scenario.epciScenarios.find((epci) => epci.epciCode === epciCode)

    return epciScenario?.b2_tx_rs ?? defaultSecondaryResidenceRate
  }

  async getVacantAccomodationEvolutionByEpciAndYear(
    epciCode: string,
    peakYear: number,
    type: 'short' | 'long' | 'total' = 'total',
  ): Promise<Record<number, number>> {
    const { simulation, baseYear, periodProjection } = this.context
    const { scenario } = simulation
    const { b1_horizon_resorption } = scenario
    const accommodationRates = await this.accommodationRatesService.getAccommodationRates(epciCode)
    const longTermVacancyRate = accommodationRates[epciCode].longTermVacancyRate
    const shortTermVacancyRate = accommodationRates[epciCode].shortTermVacancyRate

    let defaultVacancyRate = accommodationRates[epciCode].vacancyRate
    if (type === 'long') {
      defaultVacancyRate = longTermVacancyRate
    } else if (type === 'short') {
      defaultVacancyRate = shortTermVacancyRate
    }
    const targetVacancyRate = await this.getVacantAccommodationRate(defaultVacancyRate, epciCode, type)

    const result: Record<number, number> = {}

    const minYear = Math.min(peakYear, b1_horizon_resorption)
    result[baseYear] = defaultVacancyRate

    for (let year = baseYear + 1; year <= periodProjection; year++) {
      if (year <= peakYear) {
        const previousYearRate = result[year - 1]
        const rateChange = (targetVacancyRate - defaultVacancyRate) / (minYear - baseYear)
        result[year] = previousYearRate + rateChange
      } else {
        result[year] = result[peakYear] ?? defaultVacancyRate
      }
    }

    return result
  }

  async getSecondaryResidenceAccomodationEvolutionByEpciAndYear(epciCode: string, peakYear: number): Promise<Record<number, number>> {
    const { simulation, baseYear, periodProjection } = this.context
    const { scenario } = simulation
    const { b1_horizon_resorption } = scenario
    const data = await this.getFilocomFlux(epciCode)

    const defaultSecondaryResidenceRate = data.txRsParctot
    const targetSecondaryResidenceRate = this.getSecondaryResidenceRate(data.txRsParctot, epciCode)

    const result: Record<number, number> = {}

    const minYear = Math.min(peakYear, b1_horizon_resorption)

    result[baseYear] = defaultSecondaryResidenceRate
    for (let year = baseYear + 1; year <= periodProjection; year++) {
      if (year <= peakYear) {
        const previousYearRate = result[year - 1]
        const rateChange = (targetSecondaryResidenceRate - defaultSecondaryResidenceRate) / (minYear - baseYear)
        result[year] = previousYearRate + rateChange
      } else {
        result[year] = result[peakYear] ?? defaultSecondaryResidenceRate
      }
    }

    return result
  }
}
