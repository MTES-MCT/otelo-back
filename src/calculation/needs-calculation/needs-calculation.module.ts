import { Module, Scope } from '@nestjs/common'
import { REQUEST } from '@nestjs/core'
import { Request } from 'express'
import { CoefficientCalculationModule } from '~/calculation/coefficient-calculation/coefficient-calculation.module'
import { CoefficientCalculationService } from '~/calculation/coefficient-calculation/coefficient-calculation.service'
import { DemographicEvolutionService } from '~/calculation/needs-calculation/besoins-flux/evolution-demographique-b21/demographic-evolution.service'
import { RenewalHousingStockService } from '~/calculation/needs-calculation/besoins-flux/occupation-renouvellement-parc-logements-b22/renewal-housing-stock.service'
import { SocialParcService } from '~/calculation/needs-calculation/besoins-stock/besoins-menages-social-b17/social-parc.service'
import { HostedService } from '~/calculation/needs-calculation/besoins-stock/heberges-b12/hosted.service'
import { NoAccomodationService } from '~/calculation/needs-calculation/besoins-stock/hors-logement-b11/no-accomodation.service'
import { FinancialInadequationService } from '~/calculation/needs-calculation/besoins-stock/inadequation-financiere-b13/financial-inadequation.service'
import { PhysicalInadequationService } from '~/calculation/needs-calculation/besoins-stock/inadequation-physique-b15/physical-inadequation.service'
import { BadQualityService } from '~/calculation/needs-calculation/besoins-stock/mauvaise-qualite-b14/bad-quality.service'
import { NeedsCalculationService } from '~/calculation/needs-calculation/needs-calculation.service'
import { NewConstructionsService } from '~/calculation/needs-calculation/new-constructions/new-constructions.service'
import { SitadelService } from '~/calculation/needs-calculation/sitadel/sitadel.service'
import { RatioCalculationModule } from '~/calculation/ratio-calculation/ratio-calculation.module'
import { PrismaModule } from '~/db/prisma.module'
import { SimulationsModule } from '~/simulations/simulations.module'
import { SimulationsService } from '~/simulations/simulations.service'
import { VacancyModule } from '~/vacancy/vacancy.module'

interface AuthenticatedRequest extends Request {
  user: {
    id: string
  }
}

@Module({
  exports: [NeedsCalculationService],
  imports: [PrismaModule, CoefficientCalculationModule, RatioCalculationModule, SimulationsModule, VacancyModule],
  providers: [
    {
      inject: [CoefficientCalculationService, SimulationsService, REQUEST],
      provide: 'CalculationContext',
      scope: Scope.REQUEST,
      useFactory: async (
        coefficientCalculationService: CoefficientCalculationService,
        simulationService: SimulationsService,
        request: AuthenticatedRequest,
      ) => {
        const simulationId = request.params.simulationId
        const simulation = await simulationService.get(simulationId)
        const periodProjection = simulation.scenario.projection - 2021
        const coefficient = await coefficientCalculationService.calculateCoefficient(
          simulation.scenario.b1_horizon_resorption,
          periodProjection,
        )

        return {
          coefficient,
          periodProjection,
          simulation,
        }
      },
    },
    NeedsCalculationService,
    NoAccomodationService,
    HostedService,
    FinancialInadequationService,
    BadQualityService,
    PhysicalInadequationService,
    SocialParcService,
    DemographicEvolutionService,
    RenewalHousingStockService,
    SitadelService,
    NewConstructionsService,
  ],
})
export class NeedsCalculationModule {}
