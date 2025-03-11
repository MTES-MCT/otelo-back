import { Inject, Injectable } from '@nestjs/common'
import { FilocomFlux } from '@prisma/client'
import { BaseCalculator, CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { DemographicEvolutionService } from '~/calculation/needs-calculation/besoins-flux/evolution-demographique-b21/demographic-evolution.service'
import { PrismaService } from '~/db/prisma.service'
import { TCalculationResult } from '~/schemas/calculator/calculation-result'

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

  async calculateByEpci(epciCode: string): Promise<number> {
    return this.calculateRenewalNeedsByEpci(epciCode)
  }

  private async getVacantAccommodationRate(epciCode: string): Promise<number> {
    const { simulation } = this.context
    const { scenario } = simulation
    const epciScenario = scenario.epciScenarios.find((epci) => epci.epciCode === epciCode)

    return epciScenario!.b2_tx_vacance
  }

  private getSecondaryResidenceRate(txRsParctot: number, epciCode): number {
    const { simulation } = this.context
    const { scenario } = simulation
    const epciScenario = scenario.epciScenarios.find((epci) => epci.epciCode === epciCode)
    if (epciScenario) {
      return epciScenario.b2_tx_rs
    }
    return txRsParctot
  }

  async getVacantAccomodationEvolution(): Promise<TCalculationResult> {
    const { simulation } = this.context
    const { epcis } = simulation

    const results = await Promise.all(
      epcis.map(async (epci) => ({
        epciCode: epci.code,
        value: await this.getVacantAccomodationEvolutionByEpci(epci.code),
      })),
    )
    const total = results.reduce((sum, result) => sum + result.value, 0)
    return {
      epcis: results,
      total,
    }
  }

  async getVacantAccomodationEvolutionByEpci(epciCode: string): Promise<number> {
    const data = await this.getFilocomFlux(epciCode)

    const currentVacancyRate = data.txLvParctot
    const newVacancyRate = await this.getVacantAccommodationRate(epciCode)
    const totalActualParc = data.parctot
    const demographicEvolution = await this.demographicEvolutionService.calculateByEpci(epciCode)
    const potentialNeeds = await this.getPotentialNeeds(demographicEvolution, epciCode)
    const renewalNeeds = await this.calculateByEpci(epciCode)

    return Math.round((totalActualParc - renewalNeeds + potentialNeeds) * newVacancyRate - totalActualParc * currentVacancyRate)
  }

  async getSecondaryResidenceAccomodationEvolution(): Promise<TCalculationResult> {
    const { simulation } = this.context
    const { epcis } = simulation

    const results = await Promise.all(
      epcis.map(async (epci) => ({
        epciCode: epci.code,
        value: await this.getSecondaryResidenceAccomodationEvolutionByEpci(epci.code),
      })),
    )
    const total = results.reduce((sum, result) => sum + result.value, 0)
    return {
      epcis: results,
      total,
    }
  }

  async getSecondaryResidenceAccomodationEvolutionByEpci(epciCode: string): Promise<number> {
    const data = await this.getFilocomFlux(epciCode)
    const currentSecondaryResidenceRate = data.txRsParctot
    const newSecondaryResidenceRate = this.getSecondaryResidenceRate(data.txRsParctot, epciCode)
    const totalActualParc = data.parctot
    const demographicEvolution = await this.demographicEvolutionService.calculateByEpci(epciCode)
    const potentialNeeds = await this.getPotentialNeeds(demographicEvolution, epciCode)
    const renewalNeeds = await this.calculateByEpci(epciCode)

    const evolution =
      (totalActualParc - renewalNeeds + potentialNeeds) * newSecondaryResidenceRate - totalActualParc * currentSecondaryResidenceRate

    return Math.round(evolution)
  }

  async getPotentialNeeds(demographicEvolution: number, epciCode: string): Promise<number> {
    const data = await this.getFilocomFlux(epciCode)
    const totalActualParc = data.parctot
    const actualParcRp = Math.round(totalActualParc * data.txRpParctot)
    const txLv = await this.getVacantAccommodationRate(epciCode)
    const txRs = this.getSecondaryResidenceRate(data.txRsParctot, epciCode)
    const txRp = 1 - txLv - txRs

    const renewalNeeds = await this.calculateRenewalNeedsByEpci(epciCode)
    return Math.round(
      // eslint-disable-next-line prettier/prettier
      (actualParcRp + demographicEvolution) / txRp - (totalActualParc - renewalNeeds),
    )
  }

  private async calculateTauxRestructuration(data: FilocomFlux): Promise<number> {
    const { periodProjection, simulation } = this.context
    const { scenario } = simulation
    const annualRate = (1.0 + data.txRestParctot) ** (1.0 / 6.0) - 1.0

    // Todo: restructuration per epci scenario
    const txRestAnnual = annualRate + scenario.epciScenarios[0].b2_tx_restructuration / 100.0
    return (1.0 + txRestAnnual) ** periodProjection - 1.0
  }

  private async calculateTauxDisparition(data: FilocomFlux): Promise<number> {
    const { periodProjection, simulation } = this.context
    const { scenario } = simulation
    const annualRate = (1.0 + data.txDispParctot) ** (1.0 / 6.0) - 1.0

    // Todo: disparition per epci scenario
    const txDistAnnual = annualRate + scenario.epciScenarios[0].b2_tx_disparition / 100.0
    return (1.0 + txDistAnnual) ** periodProjection - 1.0
  }

  async calculate(): Promise<TCalculationResult> {
    const { simulation } = this.context
    const { epcis } = simulation
    const results = await Promise.all(
      epcis.map(async (epci) => ({
        epciCode: epci.code,
        value: await this.calculateByEpci(epci.code),
      })),
    )
    const total = results.reduce((sum, result) => sum + result.value, 0)
    return {
      epcis: results,
      total,
    }
  }

  async calculateRenewalNeedsByEpci(epciCode: string): Promise<number> {
    const data = await this.getFilocomFlux(epciCode)

    const restructurationTaux = await this.calculateTauxRestructuration(data)
    const disparitionTaux = await this.calculateTauxDisparition(data)
    const renouvellement = data.parctot * (restructurationTaux - disparitionTaux)
    return Math.round(-1 * renouvellement)
  }
}
