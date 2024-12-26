import { Inject, Injectable } from '@nestjs/common'
import { CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { DemographicEvolutionService } from '~/calculation/needs-calculation/besoins-flux/evolution-demographique-b21/demographic-evolution.service'
import { RenewalHousingStockService } from '~/calculation/needs-calculation/besoins-flux/occupation-renouvellement-parc-logements-b22/renewal-housing-stock.service'
import { SocialParcService } from '~/calculation/needs-calculation/besoins-stock/besoins-menages-social-b17/social-parc.service'
import { HostedService } from '~/calculation/needs-calculation/besoins-stock/heberges-b12/hosted.service'
import { NoAccomodationService } from '~/calculation/needs-calculation/besoins-stock/hors-logement-b11/no-accomodation.service'
import { FinancialInadequationService } from '~/calculation/needs-calculation/besoins-stock/inadequation-financiere-b13/financial-inadequation.service'
import { PhysicalInadequationService } from '~/calculation/needs-calculation/besoins-stock/inadequation-physique-b15/physical-inadequation.service'
import { BadQualityService } from '~/calculation/needs-calculation/besoins-stock/mauvaise-qualite-b14/bad-quality.service'
import { TResults } from '~/schemas/results/results'

@Injectable()
export class NeedsCalculationService {
  constructor(
    @Inject('CalculationContext')
    protected readonly context: CalculationContext,
    private readonly noAccomodationService: NoAccomodationService,
    private readonly hostedService: HostedService,
    private readonly financialInadequationService: FinancialInadequationService,
    private readonly badQualityService: BadQualityService,
    private readonly physicalInadequationService: PhysicalInadequationService,
    private readonly socialParcService: SocialParcService,
    private readonly demographicEvolutionService: DemographicEvolutionService,
    private readonly renewalHousingStock: RenewalHousingStockService,
  ) {}

  async calculate(): Promise<TResults> {
    const [
      currentDemographicEvolution,
      futureDemographicProjections,
      vacantAccomodationEvolution,
      renewalNeeds,
      secondaryResidenceAccomodationEvolution,
      noAccomodation,
      hosted,
      financialInadequation,
      physicalInadequation,
      badQuality,
      socialParc,
    ] = await Promise.all([
      this.demographicEvolutionService.calculate(),
      this.demographicEvolutionService.calculateOmphaleProjectionsByYear(),
      this.renewalHousingStock.getVacantAccomodationEvolution(),
      this.renewalHousingStock.calculateRenewalNeeds(),
      this.renewalHousingStock.getSecondaryResidenceAccomodationEvolution(),
      this.noAccomodationService.calculate(),
      this.hostedService.calculate(),
      this.financialInadequationService.calculate(),
      this.physicalInadequationService.calculate(),
      this.badQualityService.calculate(),
      this.socialParcService.calculate(),
    ])

    const totalStock = noAccomodation + hosted + financialInadequation + physicalInadequation + badQuality + socialParc
    const totalFlux = currentDemographicEvolution + secondaryResidenceAccomodationEvolution + vacantAccomodationEvolution + renewalNeeds
    const total = totalFlux + totalStock

    return {
      badQuality,
      demographicEvolution: {
        currentProjection: currentDemographicEvolution,
        futureProjections: futureDemographicProjections,
      },
      financialInadequation,
      hosted,
      noAccomodation,
      physicalInadequation,
      renewalNeeds,
      secondaryResidenceAccomodationEvolution,
      socialParc,
      total,
      totalFlux,
      totalStock,
      vacantAccomodationEvolution,
    }
  }
}
