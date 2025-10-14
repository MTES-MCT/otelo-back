import { Inject, Injectable } from '@nestjs/common'
import { CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { HostedService } from '~/calculation/needs-calculation/besoins-stock/heberges-b12/hosted.service'
import { NoAccomodationService } from '~/calculation/needs-calculation/besoins-stock/hors-logement-b11/no-accomodation.service'
import { FinancialInadequationService } from '~/calculation/needs-calculation/besoins-stock/inadequation-financiere-b13/financial-inadequation.service'
import { PhysicalInadequationService } from '~/calculation/needs-calculation/besoins-stock/inadequation-physique-b15/physical-inadequation.service'
import { BadQualityService } from '~/calculation/needs-calculation/besoins-stock/mauvaise-qualite-b14/bad-quality.service'
import { TStockRequirementsResults } from '~/schemas/results/results'

@Injectable()
export class StockRequirementsService {
  constructor(
    @Inject('CalculationContext')
    protected readonly context: CalculationContext,
    private readonly noAccomodationService: NoAccomodationService,
    private readonly hostedService: HostedService,
    private readonly financialInadequationService: FinancialInadequationService,
    private readonly badQualityService: BadQualityService,
    private readonly physicalInadequationService: PhysicalInadequationService,
  ) {}

  async calculateStock(): Promise<TStockRequirementsResults> {
    const [noAccomodation, hosted, financialInadequation, physicalInadequation, badQuality] = await Promise.all([
      this.noAccomodationService.calculate(),
      this.hostedService.calculate(),
      this.financialInadequationService.calculate(),
      this.physicalInadequationService.calculate(),
      this.badQualityService.calculate(),
    ])
    return { noAccomodation, hosted, financialInadequation, physicalInadequation, badQuality }
  }

  calculateStockByEpci(epciCode: string, data: TStockRequirementsResults) {
    const { noAccomodation, hosted, financialInadequation, physicalInadequation, badQuality } = data
    const categories = [noAccomodation, hosted, financialInadequation, physicalInadequation, badQuality]

    return categories.reduce((total, category) => {
      const epciResult = category.epcis.find((e) => e.epciCode === epciCode)
      return total + (epciResult?.value ?? 0)
    }, 0)
  }

  calculateProrataStockByEpci(epciCode: string, data: TStockRequirementsResults, peakYear: number) {
    const { noAccomodation, hosted, financialInadequation, physicalInadequation, badQuality } = data
    const categories = [noAccomodation, hosted, financialInadequation, physicalInadequation, badQuality]
    const { baseYear, simulation } = this.context
    const { projection, b1_horizon_resorption: horizon } = simulation.scenario

    const baseToHorizonDelta = horizon - baseYear
    const safeDenominator = baseToHorizonDelta > 0 ? baseToHorizonDelta : 1

    const computeScaledValue = (value: number, years: number, forceFullValue = false) => {
      if (forceFullValue || baseToHorizonDelta <= 0) {
        return Math.round(value)
      }

      const effectiveYears = Math.max(Math.min(years, baseToHorizonDelta), 0)
      return Math.round((effectiveYears * value) / safeDenominator)
    }

    const { total, prePeakTotal, postPeakTotal } = categories.reduce(
      (acc, category) => {
        const epciResult = category.epcis.find((e) => e.epciCode === epciCode)
        if (!epciResult) {
          return acc
        }

        const yearsBeforePeak = peakYear - baseYear
        const requiresFullValue = peakYear >= horizon
        const yearsAfterPeak = projection - peakYear

        const baseValue = projection > peakYear ? epciResult.value : epciResult.prorataValue
        const prePeakValue = computeScaledValue(baseValue, yearsBeforePeak, requiresFullValue)
        const postPeakValue = computeScaledValue(baseValue, yearsAfterPeak)

        return {
          total: acc.total + epciResult.prorataValue,
          prePeakTotal: acc.prePeakTotal + prePeakValue,
          postPeakTotal: acc.postPeakTotal + postPeakValue,
        }
      },
      { total: 0, prePeakTotal: 0, postPeakTotal: 0 },
    )

    return {
      total,
      prePeakTotal,
      postPeakTotal,
    }
  }
}
