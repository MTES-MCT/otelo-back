import { Inject, Injectable } from '@nestjs/common'
import { FilocomFlux } from '@prisma/client'
import { BaseCalculator, CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { DemographicEvolutionService } from '~/calculation/needs-calculation/besoins-flux/evolution-demographique-b21/demographic-evolution.service'
import { PrismaService } from '~/db/prisma.service'

@Injectable()
export class RenewalHousingStockService extends BaseCalculator {
  constructor(
    @Inject('CalculationContext')
    protected readonly context: CalculationContext,
    private readonly prismaService: PrismaService,
    private readonly demographicEvolutionService: DemographicEvolutionService,
  ) {
    super(context)
  }

  async getFilocomFlux(epciCode: string): Promise<FilocomFlux> {
    return this.prismaService.filocomFlux.findFirstOrThrow({
      where: {
        epciCode,
      },
    })
  }

  async calculate(): Promise<number> {
    const demographicEvolution = await this.demographicEvolutionService.calculate()
    const potentialNeeds = await this.getPotentialNeeds(demographicEvolution)
    return Math.round(potentialNeeds - demographicEvolution)
  }

  private getVacantAccommodationRate(txLvParctot: number): number {
    const { simulation } = this.context
    const { scenario } = simulation
    if (scenario.b2_tx_vacance !== 0) {
      return scenario.b2_tx_vacance / 100
    }
    return txLvParctot
  }

  private getSecondaryResidenceRate(txRsParctot: number): number {
    const { simulation } = this.context
    const { scenario } = simulation
    if (scenario.b2_tx_rs !== 0) {
      return scenario.b2_tx_rs / 100
    }
    return txRsParctot
  }

  async getVacantAccomodationEvolution(): Promise<number> {
    const { simulation } = this.context
    const { epci } = simulation
    const { code: epciCode } = epci
    const data = await this.getFilocomFlux(epciCode)

    const currentVacancyRate = data.txLvParctot
    const newVacancyRate = this.getVacantAccommodationRate(data.txLvParctot)
    const totalActualParc = data.parctot
    const demographicEvolution = await this.demographicEvolutionService.calculate()
    const potentialNeeds = await this.getPotentialNeeds(demographicEvolution)
    const renewalNeeds = await this.calculateRenewalNeeds()

    const evolution = (totalActualParc - renewalNeeds + potentialNeeds) * newVacancyRate - totalActualParc * currentVacancyRate
    return Math.round(evolution)
  }

  async getSecondaryResidenceAccomodationEvolution(): Promise<number> {
    const { simulation } = this.context
    const { epci } = simulation

    const data = await this.getFilocomFlux(epci.code)
    const currentSecondaryResidenceRate = data.txRsParctot
    const newSecondaryResidenceRate = this.getSecondaryResidenceRate(data.txRsParctot)
    const totalActualParc = data.parctot
    const demographicEvolution = await this.demographicEvolutionService.calculate()
    const potentialNeeds = await this.getPotentialNeeds(demographicEvolution)
    const renewalNeeds = await this.calculateRenewalNeeds()

    const evolution =
      (totalActualParc - renewalNeeds + potentialNeeds) * newSecondaryResidenceRate - totalActualParc * currentSecondaryResidenceRate

    return Math.round(evolution)
  }

  async getPotentialNeeds(demographicEvolution: number): Promise<number> {
    const { simulation } = this.context
    const { epci } = simulation
    const { code: epciCode } = epci
    const data = await this.getFilocomFlux(epciCode)

    const totalActualParc = data.parctot
    const actualParcRp = Math.round(totalActualParc * data.txRpParctot)
    const txLv = this.getVacantAccommodationRate(data.txLvParctot)
    const txRs = this.getSecondaryResidenceRate(data.txRsParctot)
    const txRp = 1 - txLv - txRs

    const renewalNeeds = await this.calculateRenewalNeeds()
    return Math.round(
      // eslint-disable-next-line prettier/prettier
      (actualParcRp + demographicEvolution) / txRp - (totalActualParc - renewalNeeds),
    )
  }

  private async calculateTauxRestructuration(data: FilocomFlux): Promise<number> {
    const { periodProjection, simulation } = this.context
    const { scenario } = simulation
    const annualRate = (1.0 + data.txRestParctot) ** (1.0 / 6.0) - 1.0
    const txRestAnnual = annualRate + scenario.b2_tx_restructuration / 100.0

    return (1.0 + txRestAnnual) ** periodProjection - 1.0
  }

  private async calculateTauxDisparition(data: FilocomFlux): Promise<number> {
    const { periodProjection, simulation } = this.context
    const { scenario } = simulation
    const annualRate = (1.0 + data.txDispParctot) ** (1.0 / 6.0) - 1.0
    const txDistAnnual = annualRate + scenario.b2_tx_disparition / 100.0
    return (1.0 + txDistAnnual) ** periodProjection - 1.0
  }

  async calculateRenewalNeeds(): Promise<number> {
    const { simulation } = this.context
    const { epci } = simulation
    const { code: epciCode } = epci
    const data = await this.getFilocomFlux(epciCode)

    const restructurationTaux = await this.calculateTauxRestructuration(data)
    const disparitionTaux = await this.calculateTauxDisparition(data)
    const renouvellement = data.parctot * (restructurationTaux - disparitionTaux)
    return Math.round(-1 * renouvellement)
  }
}
