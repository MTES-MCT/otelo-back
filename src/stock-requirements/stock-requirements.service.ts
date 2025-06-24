import { Inject, Injectable } from '@nestjs/common'
import { CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { SocialParcService } from '~/calculation/needs-calculation/besoins-stock/besoins-menages-social-b17/social-parc.service'
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
    private readonly socialParcService: SocialParcService,
  ) {}

  async calculateStock(): Promise<TStockRequirementsResults> {
    const [noAccomodation, hosted, financialInadequation, physicalInadequation, badQuality, socialParc] = await Promise.all([
      this.noAccomodationService.calculate(),
      this.hostedService.calculate(),
      this.financialInadequationService.calculate(),
      this.physicalInadequationService.calculate(),
      this.badQualityService.calculate(),
      this.socialParcService.calculate(),
    ])

    return { noAccomodation, hosted, financialInadequation, physicalInadequation, badQuality, socialParc }
  }

  calculateStockByEpci(epciCode: string, data: TStockRequirementsResults) {
    const { noAccomodation, hosted, financialInadequation, physicalInadequation, badQuality, socialParc } = data
    const categories = [noAccomodation, hosted, financialInadequation, physicalInadequation, badQuality, socialParc]

    return categories.reduce((total, category) => {
      const epciResult = category.epcis.find((e) => e.epciCode === epciCode)
      return total + (epciResult?.value ?? 0)
    }, 0)
  }
}
