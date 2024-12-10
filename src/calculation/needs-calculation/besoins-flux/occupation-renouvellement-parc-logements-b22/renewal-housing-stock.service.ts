import { Inject, Injectable } from '@nestjs/common'
import { FilocomFlux } from '@prisma/client'
import { coefficientConfig } from '~/calculation/coefficient-calculation/coefficient.config'
import { BaseCalculator, CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { DemographicEvolutionService } from '~/calculation/needs-calculation/besoins-flux/evolution-demographique-b21/demographic-evolution.service'
import { PrismaService } from '~/db/prisma.service'

@Injectable()
export class RenewalHousingStockService extends BaseCalculator {
  private readonly DEFAULT_PROJECTION_PERIOD = 6

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

  async getPotentialNeeds(demographicEvolution: number): Promise<number> {
    const { simulation } = this.context
    const { epci } = simulation

    const flux = await this.getFilocomFlux(epci.code)

    const calculateParcRpActuel = () => Math.round(totalActualParc * flux.txRpParctot)
    const calculateTauxLv = () => Math.round(flux.txLvParctot + scenario.b2_tx_vacance / 100)
    const calculateTauxRs = () => Math.round(flux.txRsParctot + scenario.b2_tx_rs / 100)
    const calculateTauxRp = () => 1 - calculateTauxLv() - calculateTauxRs()

    const { scenario } = simulation

    const totalActualParc = flux.parctot
    const rpActualParc = calculateParcRpActuel()

    return Math.round(
      (rpActualParc + demographicEvolution) / calculateTauxRp() -
        (totalActualParc - (await this.calculateBesoinRenouvellement(totalActualParc))),
    )
  }

  private async getAnnualTaux(rateKey: 'txrest_parctot' | 'txdisp_parctot'): Promise<number> {
    const { simulation } = this.context
    const { epci } = simulation
    const { region } = epci

    const flux = await this.getFilocomFlux(epci.code)

    const coeff = !['01', '02', '03', '04'].includes(region) ? coefficientConfig.baseCoeff.default : coefficientConfig.baseCoeff[region]
    const currentRate = rateKey === 'txrest_parctot' ? flux.txRestParctot : flux.txDispParctot

    return Math.round((1.0 + currentRate) ** (1.0 / coeff) - 1.0)
  }

  private async getTauxRestructurationAnnuel(): Promise<number> {
    return this.getAnnualTaux('txrest_parctot')
  }

  private async getTauxDisparitionAnnuel(): Promise<number> {
    return this.getAnnualTaux('txdisp_parctot')
  }

  private async calculateTauxRestructuration(): Promise<number> {
    const { simulation } = this.context
    const { scenario } = simulation
    const periodProjection = this.DEFAULT_PROJECTION_PERIOD
    const annualRate = (await this.getTauxRestructurationAnnuel()) + scenario.b2_tx_restructuration / 100.0

    return Math.round((1.0 + annualRate) ** periodProjection - 1.0)
  }

  private async calculateTauxDisparition(): Promise<number> {
    const { simulation } = this.context
    const { scenario } = simulation
    const periodProjection = this.DEFAULT_PROJECTION_PERIOD
    const annualRate = (await this.getTauxDisparitionAnnuel()) + scenario.b2_tx_disparition / 100.0

    return Math.round((1.0 + annualRate) ** periodProjection - 1.0)
  }

  private async calculateBesoinRenouvellement(totalActualParc: number): Promise<number> {
    const restructurationTaux = await this.calculateTauxRestructuration()
    const disparitionTaux = await this.calculateTauxDisparition()
    const renouvellement = totalActualParc * (restructurationTaux - disparitionTaux)

    return Math.round(-1 * renouvellement)
  }
}
