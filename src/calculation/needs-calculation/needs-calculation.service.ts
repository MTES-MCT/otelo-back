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
import { PrismaService } from '~/db/prisma.service'
import { TResults } from '~/schemas/results/results'

@Injectable()
export class NeedsCalculationService {
  constructor(
    @Inject('CalculationContext')
    protected readonly context: CalculationContext,
    private readonly prismaService: PrismaService,
    private readonly noAccomodationService: NoAccomodationService,
    private readonly hostedService: HostedService,
    private readonly inadFinanciereService: FinancialInadequationService,
    private readonly badQualityService: BadQualityService,
    private readonly physicalInadequationService: PhysicalInadequationService,
    private readonly socialParcService: SocialParcService,
    private readonly demographicEvolutionService: DemographicEvolutionService,
    private readonly renewalHousingStock: RenewalHousingStockService,
  ) {}

  async calculate(): Promise<TResults> {
    const currentDemographicEvolution = await this.demographicEvolutionService.calculate()
    const futureDemographicProjections = await this.demographicEvolutionService.calculateOmphaleProjectionsByYear()

    // todo
    const totalStock = 0
    const totalFlux = currentDemographicEvolution
    const total = totalFlux + totalStock

    return {
      demographicEvolution: {
        currentProjection: currentDemographicEvolution,
        futureProjections: futureDemographicProjections,
      },
      total,
      totalFlux: currentDemographicEvolution,
      totalStock,
    }
  }
}
