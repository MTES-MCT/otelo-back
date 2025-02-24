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
import { NewConstructionsService } from '~/calculation/needs-calculation/new-constructions/new-constructions.service'
import { SitadelService } from '~/calculation/needs-calculation/sitadel/sitadel.service'
import { TEpciCalculationResult } from '~/schemas/calculator/calculation-result'
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
    private readonly sitadelService: SitadelService,
    private readonly newConstructionsService: NewConstructionsService,
  ) {}

  async calculate(): Promise<TResults> {
    const [
      demographicEvolution,
      vacantAccomodationEvolution,
      renewalNeeds,
      secondaryResidenceAccomodationEvolution,
      noAccomodation,
      hosted,
      financialInadequation,
      physicalInadequation,
      badQuality,
      socialParc,
      sitadel,
      newConstructions,
    ] = await Promise.all([
      this.demographicEvolutionService.calculate(),
      this.renewalHousingStock.getVacantAccomodationEvolution(),
      this.renewalHousingStock.calculate(),
      this.renewalHousingStock.getSecondaryResidenceAccomodationEvolution(),
      this.noAccomodationService.calculate(),
      this.hostedService.calculate(),
      this.financialInadequationService.calculate(),
      this.physicalInadequationService.calculate(),
      this.badQualityService.calculate(),
      this.socialParcService.calculate(),
      this.sitadelService.calculate(),
      this.newConstructionsService.calculate(),
    ])
    let total = 0
    let totalStock = 0
    let totalFlux = 0

    const epcisTotals = this.context.simulation.epcis.map((epci) => {
      const epciTotalFlux =
        (demographicEvolution.epcis.find((e) => e.epciCode === epci.code) as TEpciCalculationResult).value +
        (secondaryResidenceAccomodationEvolution.epcis.find((e) => e.epciCode === epci.code) as TEpciCalculationResult).value +
        (vacantAccomodationEvolution.epcis.find((e) => e.epciCode === epci.code) as TEpciCalculationResult).value +
        (renewalNeeds.epcis.find((e) => e.epciCode === epci.code) as TEpciCalculationResult).value

      const epciTotalStock =
        (noAccomodation.epcis.find((e) => e.epciCode === epci.code) as TEpciCalculationResult).value +
        (hosted.epcis.find((e) => e.epciCode === epci.code) as TEpciCalculationResult).value +
        (financialInadequation.epcis.find((e) => e.epciCode === epci.code) as TEpciCalculationResult).value +
        (physicalInadequation.epcis.find((e) => e.epciCode === epci.code) as TEpciCalculationResult).value +
        (badQuality.epcis.find((e) => e.epciCode === epci.code) as TEpciCalculationResult).value +
        (socialParc.epcis.find((e) => e.epciCode === epci.code) as TEpciCalculationResult).value

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
