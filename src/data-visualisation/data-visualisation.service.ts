import { Injectable } from '@nestjs/common'
import { DemographicEvolutionService } from '~/demographic-evolution/demographic-evolution.service'
import { EpcisService } from '~/epcis/epcis.service'
import { RpInseeService } from '~/rp-insee/rp-insee.service'
import { TDataVisualisation } from '~/schemas/data-visualisation/data-visualisation'

@Injectable()
export class DataVisualisationService {
  constructor(
    private readonly epcisService: EpcisService,
    private readonly demographicEvolutionService: DemographicEvolutionService,
    private readonly rpInseeService: RpInseeService,
  ) {}
  async getDataByType(type: TDataVisualisation, epci: string, populationType?: string) {
    const bassinEpcis = await this.epcisService.getBassinEpcisByEpciCode(epci)
    const epcis = bassinEpcis.map((epci) => ({ code: epci.code, name: epci.name }))

    switch (type) {
      case 'projection-menages-evolution':
        return this.demographicEvolutionService.getDemographicEvolutionOmphaleAndYear(epcis, populationType)
      case 'projection-population-evolution':
        return this.demographicEvolutionService.getDemographicEvolutionPopulationAndYear(epcis)
      case 'menage-evolution':
        return this.rpInseeService.getRP(epcis, 'menage')
      case 'population-evolution':
        return this.rpInseeService.getRP(epcis, 'population')
      default:
        throw new Error('Invalid data visualisation type')
    }
  }
}
