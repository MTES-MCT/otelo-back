import { Inject, Injectable } from '@nestjs/common'
import { Homeless, HostedFiness, Hotel, MakeShiftHousing_RP, MakeShiftHousing_SNE } from '@prisma/client'
import { BaseCalculator, CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { PrismaService } from '~/db/prisma.service'
import { TCalculationResult } from '~/schemas/calculator/calculation-result'
import { ESourceB11 } from '~/schemas/scenarios/scenario'

@Injectable()
export class NoAccomodationService extends BaseCalculator {
  constructor(
    @Inject('CalculationContext')
    protected readonly context: CalculationContext,
    private readonly prismaService: PrismaService,
  ) {
    super(context)
  }

  async getHostedFiness(epciCode: string): Promise<HostedFiness> {
    return this.prismaService.hostedFiness.findFirstOrThrow({
      where: {
        epciCode,
      },
    })
  }

  async getHotel(epciCode: string): Promise<Hotel> {
    return this.prismaService.hotel.findFirstOrThrow({
      where: {
        epciCode,
      },
    })
  }

  async getRPMakeShiftHousing(epciCode: string): Promise<MakeShiftHousing_RP> {
    return this.prismaService.makeShiftHousing_RP.findFirstOrThrow({
      where: {
        epciCode,
      },
    })
  }

  async getSNEMakeShiftHousing(epciCode: string): Promise<MakeShiftHousing_SNE> {
    return this.prismaService.makeShiftHousing_SNE.findFirstOrThrow({
      where: {
        epciCode,
      },
    })
  }

  getHomeless(epciCode: string): Promise<Homeless> {
    return this.prismaService.homeless.findFirstOrThrow({
      where: {
        epciCode,
      },
    })
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

  async calculateByEpci(epciCode: string): Promise<number> {
    const { simulation } = this.context
    const { scenario } = simulation

    const { b11_fortune, b11_hotel, b11_sa, source_b11 } = scenario
    const homeless = await this.getHomeless(epciCode)
    const hotel = await this.getHotel(epciCode)

    const sourceMap = {
      [ESourceB11.RP]: {
        habitat_fortune: (await this.getRPMakeShiftHousing(epciCode)).value,
        hotel: hotel.rp,
        sans_abri: homeless.rp,
      },
      [ESourceB11.SNE]: {
        habitat_fortune: (await this.getSNEMakeShiftHousing(epciCode)).camping + (await this.getSNEMakeShiftHousing(epciCode)).squat,
        hotel: hotel.sne,
        sans_abri: homeless.sne,
      },
    }
    const selectedSource = sourceMap[source_b11]
    const result = [
      (b11_sa && selectedSource.sans_abri) || 0,
      (b11_fortune && selectedSource.habitat_fortune) || 0,
      (b11_hotel && selectedSource.hotel) || 0,
    ].reduce((sum, value) => sum + value, 0)

    try {
      const hostedFiness = await this.getHostedFiness(epciCode)
      const establishmentResult = scenario.b11_etablissement.reduce((sum, etab) => sum + hostedFiness[etab], 0)

      const totalResult = result + Math.round(establishmentResult * (scenario.b11_part_etablissement / 100.0))

      return this.applyCoefficient(totalResult)
    } catch {
      return 0
    }
  }
}
