import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { AuthenticationGuard } from '~/common/guards/authentication.guard'
import { AuthorizationGuard } from '~/common/guards/authorization.guard'
import envRessources from '~/config/environment'
import { ResultsModule } from '~/results/results.module'
import { AccommodationRatesModule } from './accommodation-rates/accommodation-rates.module'
import { AuthModule } from './auth/auth.module'
import { CalculationModule } from './calculation/calculation.module'
import { DemographicEvolutionModule } from './demographic-evolution/demographic-evolution.module'
import { EpcisModule } from './epcis/epcis.module'
import { HealthController } from './health/health.controller'
import { ScenariosModule } from './scenarios/scenarios.module'
import { SessionsModule } from './sessions/sessions.module'
import { SimulationsModule } from './simulations/simulations.module'
import { UsersModule } from './users/users.module'

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envRessources],
    }),
    ScenariosModule,
    SessionsModule,
    UsersModule,
    AuthModule,
    EpcisModule,
    SimulationsModule,
    CalculationModule,
    ResultsModule,
    DemographicEvolutionModule,
    AccommodationRatesModule,
  ],
  providers: [
    AuthenticationGuard,
    AuthorizationGuard,
    {
      provide: APP_GUARD,
      useExisting: AuthenticationGuard,
    },
    {
      provide: APP_GUARD,
      useExisting: AuthorizationGuard,
    },
  ],
})
export class MainModule {}
