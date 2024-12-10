import { Inject, Injectable } from '@nestjs/common'
import { BaseCalculator, CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { PrismaService } from '~/db/prisma.service'
import {
  EOmphale,
  TDemographicEvolutionOmphale,
  TGetDemographicEvolution,
  TGetDemographicEvolutionByOmphaleQuery,
  TGetDemographicEvolutionByYearAndOmphaleQuery,
} from '~/schemas/demographic-evolution/demographic-evolution'

export const omphaleMap = {
  central_b: EOmphale.CENTRAL_B,
  central_c: EOmphale.CENTRAL_C,
  central_h: EOmphale.CENTRAL_H,
  pb_b: EOmphale.PB_B,
  pb_c: EOmphale.PB_C,
  pb_h: EOmphale.PB_H,
  ph_b: EOmphale.PH_B,
  ph_c: EOmphale.PH_C,
  ph_h: EOmphale.PH_H,
}

@Injectable()
export class DemographicEvolutionService extends BaseCalculator {
  constructor(
    @Inject('CalculationContext')
    protected readonly context: CalculationContext,
    private readonly prismaService: PrismaService,
  ) {
    super(context)
  }

  async getPopulationProjectionsByYear(epciCode: string) {
    return this.prismaService.demographicEvolutionPopulation.findMany({
      where: {
        epciCode,
      },
    })
  }

  async getProjectionByYearAndOmphale(query: TGetDemographicEvolutionByYearAndOmphaleQuery): Promise<TGetDemographicEvolution> {
    const { simulation } = this.context
    const { epci } = simulation
    const { code: epciCode } = epci
    const { omphale, year } = query

    const demographicEvolution = await this.prismaService.demographicEvolutionOmphale.findFirstOrThrow({
      select: { epciCode: true, [omphale]: true, year: true },
      where: {
        epciCode,
        year,
      },
    })

    return {
      centralB: demographicEvolution.centralB,
      centralC: demographicEvolution.centralC,
      centralH: demographicEvolution.centralH,
      epciCode,
      pbB: demographicEvolution.pbB,
      pbC: demographicEvolution.pbC,
      pbH: demographicEvolution.pbH,
      phB: demographicEvolution.phB,
      phC: demographicEvolution.phC,
      phH: demographicEvolution.phH,
      year,
    }
  }

  async getProjectionsByOmphale(query: TGetDemographicEvolutionByOmphaleQuery): Promise<TGetDemographicEvolution[]> {
    const { simulation } = this.context
    const { epci } = simulation
    const { code: epciCode } = epci
    const { omphale } = query

    const demographicEvolutions = await this.prismaService.demographicEvolutionOmphale.findMany({
      select: { epciCode: true, [omphale]: true, year: true },
      where: {
        epciCode,
      },
    })

    return demographicEvolutions.map((d) => ({
      epciCode: d.epciCode,
      [omphale]: d[omphale],
      year: d.year,
    }))
  }

  async calculate(): Promise<number> {
    const { simulation } = this.context
    const { epci, scenario } = simulation
    const { code: epciCode } = epci
    const baseYear = 2018

    const omphale = omphaleMap[scenario.b2_scenario_omphale.toLowerCase()]
    const baseProjection = await this.getProjectionByYearAndOmphale({
      epciCode,
      omphale,
      year: baseYear,
    })

    const futureProjection = await this.getProjectionByYearAndOmphale({
      epciCode,
      omphale,
      year: scenario.projection,
    })
    return this.applyCoefficient(futureProjection[omphale] - baseProjection[omphale])
  }

  async calculateProjectionsByYear(): Promise<TDemographicEvolutionOmphale> {
    const { simulation } = this.context
    const { epci, scenario } = simulation
    const { code: epciCode } = epci
    const baseYear = 2018

    const omphale = omphaleMap[scenario.b2_scenario_omphale.toLowerCase()]
    const baseProjection = await this.getProjectionByYearAndOmphale({
      epciCode,
      omphale,
      year: baseYear,
    })

    const futureProjections = await this.getProjectionsByOmphale({
      epciCode,
      omphale,
    })

    const { max, min, periodMax, periodMin, yearlyData } = futureProjections
      // we dont want the base year data in the yearly data
      .filter(({ year }) => year !== baseYear)
      .reduce(
        (acc, projection) => {
          const value = this.applyCoefficient(projection[omphale] - baseProjection[omphale])

          return {
            max: Math.max(acc.max, value),
            min: Math.min(acc.min, value),
            periodMax: Math.max(acc.periodMax, projection.year),
            periodMin: Math.min(acc.periodMin, projection.year),
            yearlyData: [...acc.yearlyData, { value, year: projection.year }],
          }
        },
        {
          max: -Infinity,
          min: Infinity,
          periodMax: -Infinity,
          periodMin: Infinity,
          yearlyData: [] as { value: number; year: number }[],
        },
      )

    return {
      data: yearlyData,
      metadata: {
        data: {
          max,
          min,
        },
        period: {
          endYear: periodMax,
          startYear: periodMin,
        },
      },
    }
  }
}
