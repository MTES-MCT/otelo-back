import { TCalculationResult, TChartData, TChartDataResult } from '~/schemas/calculator/calculation-result'
import { TSimulationWithEpciAndScenario } from '~/schemas/simulations/simulation'

export interface CalculationContext {
  coefficient: number
  periodProjection: number
  simulation: TSimulationWithEpciAndScenario
}

export abstract class BaseCalculator {
  constructor(protected readonly context: CalculationContext) {}

  abstract calculate(): Promise<TCalculationResult | TChartDataResult>
  abstract calculateByEpci(epciCode: string): Promise<number | TChartData>

  protected applyCoefficient(value: number): number {
    return Math.round(value * this.context.coefficient)
  }
}
