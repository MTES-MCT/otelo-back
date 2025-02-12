import { Inject, Injectable } from '@nestjs/common'
import { BaseCalculator, CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { PrismaService } from '~/db/prisma.service'
import { TChartDataResult } from '~/schemas/calculator/calculation-result'

@Injectable()
export class SitadelService extends BaseCalculator {
  constructor(
    @Inject('CalculationContext')
    protected readonly context: CalculationContext,
    private readonly prismaService: PrismaService,
  ) {
    super(context)
  }

  async calculate(): Promise<TChartDataResult> {
    const { simulation } = this.context
    const { epcis } = simulation
    const results = await Promise.all(epcis.map((epci) => this.calculateByEpci(epci.code)))
    return {
      epcis: results,
    }
  }

  async calculateByEpci(epciCode: string) {
    const sitadel = await this.prismaService.sitadel.findMany({
      orderBy: {
        year: 'asc',
      },
      select: {
        value: true,
        year: true,
      },
      where: {
        epciCode,
      },
    })
    const { max, min } = sitadel.reduce(
      (acc, data) => {
        Object.entries(data).forEach(([key, value]) => {
          if (key !== 'year') {
            const numValue = Number(value)
            acc.min = Math.min(acc.min, numValue)
            acc.max = Math.max(acc.max, numValue)
          }
        })
        return acc
      },
      { max: -Infinity, min: Infinity },
    )
    return {
      code: epciCode,
      data: sitadel,
      metadata: {
        max,
        min,
      },
    }
  }
}
