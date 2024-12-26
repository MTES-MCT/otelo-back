import { Inject, Injectable } from '@nestjs/common'
import { Homeless, HostedFiness, Hotel, MakeShiftHousing_RP, MakeShiftHousing_SNE } from '@prisma/client'
import { BaseCalculator, CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { PrismaService } from '~/db/prisma.service'
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

  async getHostedFiness(): Promise<HostedFiness> {
    const { simulation } = this.context
    const { epci } = simulation
    const { code: epciCode } = epci
    return this.prismaService.hostedFiness.findFirstOrThrow({
      where: {
        epciCode,
      },
    })
  }

  async getHotel(): Promise<Hotel> {
    const { simulation } = this.context
    const { epci } = simulation
    const { code: epciCode } = epci
    return this.prismaService.hotel.findFirstOrThrow({
      where: {
        epciCode,
      },
    })
  }

  async getRPMakeShiftHousing(): Promise<MakeShiftHousing_RP> {
    const { simulation } = this.context
    const { epci } = simulation
    const { code: epciCode } = epci
    return this.prismaService.makeShiftHousing_RP.findFirstOrThrow({
      where: {
        epciCode,
      },
    })
  }

  async getSNEMakeShiftHousing(): Promise<MakeShiftHousing_SNE> {
    const { simulation } = this.context
    const { epci } = simulation
    const { code: epciCode } = epci
    return this.prismaService.makeShiftHousing_SNE.findFirstOrThrow({
      where: {
        epciCode,
      },
    })
  }

  getHomeless(): Promise<Homeless> {
    const { simulation } = this.context
    const { epci } = simulation
    const { code: epciCode } = epci
    return this.prismaService.homeless.findFirstOrThrow({
      where: {
        epciCode,
      },
    })
  }

  async calculate(): Promise<number> {
    const { simulation } = this.context
    const { scenario } = simulation
    const { b11_fortune, b11_hotel, b11_sa, source_b11 } = scenario
    const homeless = await this.getHomeless()
    const hotel = await this.getHotel()

    const sourceMap = {
      [ESourceB11.RP]: {
        habitat_fortune: (await this.getRPMakeShiftHousing()).value,
        hotel: hotel.rp,
        sans_abri: homeless.rp,
      },
      [ESourceB11.SNE]: {
        habitat_fortune: (await this.getSNEMakeShiftHousing()).camping + (await this.getSNEMakeShiftHousing()).squat,
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

    const hostedFiness = await this.getHostedFiness()
    const establishmentResult = scenario.b11_etablissement.reduce((sum, etab) => sum + hostedFiness[etab], 0)

    const totalResult = result + Math.round(establishmentResult * (scenario.b11_part_etablissement / 100.0))

    return this.applyCoefficient(totalResult)
  }
}
