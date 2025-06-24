import { Inject, Injectable } from '@nestjs/common'
import { BaseCalculator, CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { PrismaService } from '~/db/prisma.service'
import { TCalculationResult } from '~/schemas/calculator/calculation-result'
import {
  EOmphale,
  TDemographicEvolution,
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

  async getProjectionByYearAndOmphale(query: TGetDemographicEvolutionByYearAndOmphaleQuery): Promise<TGetDemographicEvolution> {
    const { epciCode } = query
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
    const { epciCode, omphale } = query

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

  async calculate(): Promise<TCalculationResult> {
    const { epcis } = this.context.simulation
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
    const { simulation, baseYear } = this.context
    const { scenario } = simulation

    const omphale = omphaleMap[scenario.b2_scenario.toLowerCase()]
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
    return Math.round(futureProjection[omphale] - baseProjection[omphale])
  }

  async calculateOmphaleProjectionsByYear(): Promise<Array<{ data: TDemographicEvolution; epciCode: string }>> {
    const { simulation } = this.context
    const { epcis } = simulation

    const results = await Promise.all(
      epcis.map(async (epci) => ({
        data: await this.calculateOmphaleProjectionsByYearFromBaseAndEpci(epci.code),
        epciCode: epci.code,
      })),
    )
    return results
  }

  async calculateOmphaleProjectionsByYearAndEpci(epciCode: string, baseYear?: number): Promise<TDemographicEvolution> {
    const { simulation, baseYear: baseYearContext } = this.context
    const { scenario } = simulation

    const omphale = omphaleMap[scenario.b2_scenario.toLowerCase()]
    const omphaleBaseYear = baseYear ?? baseYearContext
    const futureProjections = await this.getProjectionsByOmphale({
      epciCode,
      omphale,
    })

    const sortedProjections = futureProjections.sort((a, b) => a.year - b.year).filter(({ year }) => year >= omphaleBaseYear)

    const { max, min, periodMax, periodMin, yearlyData } = sortedProjections.reduce(
      (acc, projection, index) => {
        const currentValue = projection[omphale]
        const previousValue = index > 0 ? sortedProjections[index - 1][omphale] : projection[omphale]
        const value = this.applyCoefficient(currentValue - previousValue)

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

  async calculateOmphaleProjectionsByYearFromBaseAndEpci(epciCode: string): Promise<TDemographicEvolution> {
    const { simulation, baseYear } = this.context
    const { scenario } = simulation

    const omphale = omphaleMap[scenario.b2_scenario.toLowerCase()]
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
      .filter(({ year }) => year >= baseYear)
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
