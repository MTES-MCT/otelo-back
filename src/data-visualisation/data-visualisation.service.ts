import { Injectable } from '@nestjs/common'
import { DemographicEvolutionService } from '~/demographic-evolution/demographic-evolution.service'
import { EpcisService } from '~/epcis/epcis.service'
import { RpInseeService } from '~/rp-insee/rp-insee.service'
import { TDataVisualisationQuery } from '~/schemas/data-visualisation/data-visualisation'
import { VacancyService } from '~/vacancy/vacancy.service'

@Injectable()
export class DataVisualisationService {
  constructor(
    private readonly epcisService: EpcisService,
    private readonly demographicEvolutionService: DemographicEvolutionService,
    private readonly rpInseeService: RpInseeService,
    private readonly vacancyService: VacancyService,
  ) {}
  async getDataByType(query: TDataVisualisationQuery) {
    const { epci, type, populationType, source } = query
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
      case 'residences-secondaires':
        if (source === 'rp') {
          return this.rpInseeService.getRP(epcis, 'secondaryAccommodation')
        }
        return []
      // return this.filocomService.getFilocomByEpci(epcis)
      case 'logements-vacants':
        if (source === 'rp') {
          return this.rpInseeService.getRP(epcis, 'vacant')
        }
        return this.vacancyService.getVacancy(epcis)
      default:
        throw new Error('Invalid data visualisation type')
    }
  }
}
