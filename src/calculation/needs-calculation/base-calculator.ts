import {
  TCalculationResult,
  TChartData,
  TChartDataResult,
  TFlowRequirementChartData,
  TFlowRequirementChartDataResult,
} from '~/schemas/calculator/calculation-result'
import { TSimulationWithEpciAndScenario } from '~/schemas/simulations/simulation'

export interface CalculationContext {
  coefficient: number
  periodProjection: number
  baseYear: number
}

export abstract class BaseCalculator<TCalculateArgs extends unknown[] = [], TCalculateByEpciArgs extends unknown[] = []> {
  constructor(protected readonly context: CalculationContext) {}

  abstract calculate(
    simulation: TSimulationWithEpciAndScenario,
    ...args: TCalculateArgs
  ): Promise<TCalculationResult | TChartDataResult | TFlowRequirementChartDataResult>
  abstract calculateByEpci(
    simulation: TSimulationWithEpciAndScenario,
    epciCode: string,
    ...args: TCalculateArgs
  ): Promise<number | TChartData | TFlowRequirementChartData>

  protected applyCoefficient(value: number): number {
    return Math.round(value * this.context.coefficient)
  }
}
