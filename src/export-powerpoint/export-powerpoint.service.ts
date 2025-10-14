import { Injectable, Logger, Scope } from '@nestjs/common'
import { NeedsCalculationService } from '~/calculation/needs-calculation/needs-calculation.service'
import { DataVisualisationService } from '~/data-visualisation/data-visualisation.service'
import { DemographicEvolutionService } from '~/demographic-evolution/demographic-evolution.service'
import { EpcisService } from '~/epcis/epcis.service'
import { PlaceholderGenerationService } from '~/export-powerpoint/placeholder-generation/placeholder-generation.service'
import { ZipService } from '~/export-powerpoint/zip/zip.service'
import { TLayout, TPowerpointPlaceholders } from '~/schemas/export-powerpoint/export-powerpoint'
import { TResults } from '~/schemas/results/results'
import { TRequestPowerpoint, TSimulationWithEpciAndScenario } from '~/schemas/simulations/simulation'
import { SimulationsService } from '~/simulations/simulations.service'

interface CommonSlideData {
  baseLayout: TLayout
  privilegedScenario: TSimulationWithEpciAndScenario
  results: TResults
  epcis: Array<{ code: string; name: string; region: string; bassinName: string | null }>
  data: TRequestPowerpoint
}

@Injectable({ scope: Scope.REQUEST })
export class ExportPowerpointService {
  private readonly logger = new Logger(ExportPowerpointService.name)
  constructor(
    private readonly zipService: ZipService,
    private readonly placeholderService: PlaceholderGenerationService,
    private readonly demographicEvolutionService: DemographicEvolutionService,
    private readonly epcisService: EpcisService,
    private readonly needsCalculationService: NeedsCalculationService,
    private readonly simulationService: SimulationsService,
    private readonly dataVisualisationService: DataVisualisationService,
  ) {}

  private readonly slideCalculators = {
    slide1: this.calculateSlide1Data.bind(this),
    slide2: this.calculateSlide2Data.bind(this),
    slide4: this.calculateSlide4Data.bind(this),
    slide6: this.calculateSlide6Data.bind(this),
    slide8: this.calculateSlide8Data.bind(this),
    slide9: this.calculateSlide9Data.bind(this),
    slide10: this.calculateSlide10Data.bind(this),
    slide11: this.calculateSlide11Data.bind(this),
    slide12: this.calculateSlide12Data.bind(this),
    slide13: this.calculateSlide13Data.bind(this),
    slide14: this.calculateSlide14Data.bind(this),
    slide15: this.calculateSlide15Data.bind(this),
    slide16: this.calculateSlide16Data.bind(this),
    slide17: this.calculateSlide17Data.bind(this),
    slide18: this.calculateSlide18Data.bind(this),
    slide19: this.calculateSlide19Data.bind(this),
    slide20: this.calculateSlide20Data.bind(this),
    slide21: this.calculateSlide21Data.bind(this),
    slide22: this.calculateSlide22Data.bind(this),
    slide23: this.calculateSlide23Data.bind(this),
    slide24: this.calculateSlide24Data.bind(this),
    slide25: this.calculateSlide25Data.bind(this),
    slide26: this.calculateSlide26Data.bind(this),
    slide27: this.calculateSlide27Data.bind(this),
    slide28: this.calculateSlide28Data.bind(this),
    slide30: this.calculateSlide30Data.bind(this),
  }

  private async prepareCommonData(data: TRequestPowerpoint): Promise<CommonSlideData> {
    const bassinEpcis = await this.epcisService.getBassinEpcisByEpciCode(data.epci.code)
    const epcis = bassinEpcis.map((epci) => ({
      code: epci.code,
      name: epci.name,
      region: epci.region,
      bassinName: epci.bassinName,
    }))
    const privilegedScenario = await this.simulationService.get(data.privilegedSimulation)
    const results = await this.needsCalculationService.calculate()

    const baseLayout: TLayout = {
      layoutEpciName: data.epci.name,
      layoutBassinName: epcis.find((epci) => epci.code === data.epci.code)?.bassinName ?? 'N/C',
      layoutStart: data.periodStart,
      layoutEnd: data.periodEnd,
      layoutDocumentType: data.documentType,
    }

    return {
      baseLayout,
      privilegedScenario,
      results,
      epcis,
      data,
    }
  }

  private calculateSlide1Data(commonData: CommonSlideData) {
    const { baseLayout, data } = commonData
    const formattedDate = data.resultDate
    const period = `${baseLayout.layoutStart}-${baseLayout.layoutEnd}`

    return {
      text: {
        selectedEpciName: baseLayout.layoutEpciName,
        documentType: baseLayout.layoutDocumentType,
        period,
        date: formattedDate,
      },
    }
  }

  private calculateSlide2Data(commonData: CommonSlideData) {
    const { privilegedScenario, data } = commonData
    return {
      text: {
        privilegedScenario: privilegedScenario.name,
        nb: String(data.selectedSimulations.length),
      },
    }
  }

  private calculateSlide4Data(commonData: CommonSlideData) {
    const { results, baseLayout, data } = commonData
    const epciFlowRequirement = results.flowRequirement.epcis.find((epci) => epci.code === data.epci.code)

    let nbNew = 0
    let nbSupp = 0

    if (epciFlowRequirement) {
      const startYear = parseInt(data.periodStart)
      const endYear = parseInt(data.periodEnd)

      for (let year = startYear; year <= endYear; year++) {
        const yearStr = year.toString()
        nbNew += epciFlowRequirement.data.housingNeeds[yearStr] || 0
        nbSupp += epciFlowRequirement.data.surplusHousing[yearStr] || 0
      }
    }

    return {
      text: {
        ...baseLayout,
        start: baseLayout.layoutStart,
        end: baseLayout.layoutEnd,
        nb: nbSupp.toString(),
        nbNew: nbNew.toString(),
        nbSupp: (nbNew + nbSupp).toString(),
        percentMenages: '0',
        nbMenages: '0',
        percentBadHousing: '0',
        nbResorption: '0',
        percentFluidity: '0',
        peakYear: baseLayout.layoutEnd,
        privilegedScenario: commonData.privilegedScenario.name,
        orgName: 'Organisation mock',
      },
    }
  }

  private calculateSlide6Data(commonData: CommonSlideData) {
    return {
      text: { ...commonData.baseLayout, territory: commonData.data.epci.name },
    }
  }

  private async calculateSlide8Data(commonData: CommonSlideData) {
    const { results } = commonData
    const scenario = commonData.privilegedScenario.scenario.b2_scenario
    const scenarioPrefix = scenario.split('_')[0]
    let selectedDemographicEvolution = ''
    switch (scenarioPrefix) {
      case 'PH':
        selectedDemographicEvolution = 'haute'
        break
      case 'PB':
        selectedDemographicEvolution = 'basse'
        break
      case 'PC':
      default:
        selectedDemographicEvolution = 'central'
        break
    }

    const flowRequirement = results.flowRequirement.epcis.find((epci) => epci.code === commonData.data.epci.code)
    const epciCode = commonData.data.epci.code
    const epcis = commonData.epcis.filter((epci) => epci.code === epciCode)
    const data = await this.demographicEvolutionService.getDemographicEvolutionPopulationAndYear(epcis)

    const chartData = {
      housingNeeds: flowRequirement?.data.housingNeeds,
      populationEvolution: data.linearChart,
      selectedScenario: selectedDemographicEvolution,
    }
    return {
      text: { ...commonData.baseLayout },
      charts: [
        {
          data: chartData,
          metadata: data.maxYears,
          templateImageFileName: 'image8.png',
          width: 615,
          height: 390,
          type: 'comparison-population-evolution-housing-needs',
        },
      ],
    }
  }

  private calculateSlide9Data(commonData: CommonSlideData) {
    return {
      text: { ...commonData.baseLayout },
    }
  }

  private async calculateSlide10Data(commonData: CommonSlideData) {
    const epciCode = commonData.data.epci.code
    const epcis = commonData.epcis.filter((epci) => epci.code === epciCode)
    const data = await this.demographicEvolutionService.getDemographicEvolutionPopulationAndYear(epcis)
    const evolutionData = data.tableData[epciCode]?.annualEvolution
    const demographicData = await this.demographicEvolutionService.getDemographicEvolutionPopulationByEpci(epciCode)
    const chartData = demographicData[epciCode]

    return {
      text: {
        ...commonData.baseLayout,
        pb1: evolutionData['2021-2030'].basse.percent,
        pb2: evolutionData['2030-2040'].basse.percent,
        pb3: evolutionData['2040-2050'].basse.percent,
        pc1: evolutionData['2021-2030'].central.percent,
        pc2: evolutionData['2030-2040'].central.percent,
        pc3: evolutionData['2040-2050'].central.percent,
        ph1: evolutionData['2021-2030'].haute.percent,
        ph2: evolutionData['2030-2040'].haute.percent,
        ph3: evolutionData['2040-2050'].haute.percent,
      },
      charts: [
        {
          data: chartData.data,
          metadata: chartData.metadata,
          templateImageFileName: 'image10.png',
          width: 527,
          height: 322,
          type: 'projection-population-evolution',
        },
      ],
    }
  }

  private async calculateSlide11Data(commonData: CommonSlideData) {
    const scenario = commonData.privilegedScenario.scenario.b2_scenario
    const epciCode = commonData.data.epci.code
    const epcis = commonData.epcis.filter((epci) => epci.code === epciCode)
    const hauteDemographicEvolution = await this.demographicEvolutionService.getDemographicEvolutionOmphaleAndYear(epcis, 'haute')
    const basseDemographicEvolution = await this.demographicEvolutionService.getDemographicEvolutionOmphaleAndYear(epcis, 'basse')
    const centralDemographicEvolution = await this.demographicEvolutionService.getDemographicEvolutionOmphaleAndYear(epcis, 'central')

    const centralData = centralDemographicEvolution.tableData[epciCode]
    const hauteData = hauteDemographicEvolution.tableData[epciCode]
    const basseData = basseDemographicEvolution.tableData[epciCode]

    let selectedDemographicEvolution
    const scenarioPrefix = scenario.split('_')[0]

    switch (scenarioPrefix) {
      case 'PH':
        selectedDemographicEvolution = hauteDemographicEvolution
        break
      case 'PB':
        selectedDemographicEvolution = basseDemographicEvolution
        break
      case 'PC':
      default:
        selectedDemographicEvolution = centralDemographicEvolution
        break
    }

    const chartData = selectedDemographicEvolution.linearChart
    return {
      text: {
        ...commonData.baseLayout,
        // Pop. Centrale - Décohabitation accélérée (haute)
        pcA1: centralData.annualEvolution['2021-2030'].haute.percent,
        pcA2: centralData.annualEvolution['2030-2040'].haute.percent,
        pcA3: centralData.annualEvolution['2040-2050'].haute.percent,
        // Pop. Centrale - Décohabitation tendancielle (central)
        pcT1: centralData.annualEvolution['2021-2030'].central.percent,
        pcT2: centralData.annualEvolution['2030-2040'].central.percent,
        pcT3: centralData.annualEvolution['2040-2050'].central.percent,
        // Pop. Centrale - Décohabitation décélérée (basse)
        pcD1: centralData.annualEvolution['2021-2030'].basse.percent,
        pcD2: centralData.annualEvolution['2030-2040'].basse.percent,
        pcD3: centralData.annualEvolution['2040-2050'].basse.percent,
        // Pop. Haute - Décohabitation tendancielle
        phT1: hauteData.annualEvolution['2021-2030'].central.percent,
        phT2: hauteData.annualEvolution['2030-2040'].central.percent,
        phT3: hauteData.annualEvolution['2040-2050'].central.percent,
        // Pop. Basse - Décohabitation tendancielle
        pbT1: basseData.annualEvolution['2021-2030'].central.percent,
        pbT2: basseData.annualEvolution['2030-2040'].central.percent,
        pbT3: basseData.annualEvolution['2040-2050'].central.percent,
      },
      charts: [
        {
          data: chartData,
          templateImageFileName: 'image11.png',
          width: 527,
          height: 322,
          type: 'projection-menages-evolution',
        },
      ],
    }
  }

  private async calculateSlide12Data(commonData: CommonSlideData) {
    const epciCode = commonData.data.epci.code
    const epcis = commonData.epcis.filter((epci) => epci.code === epciCode)
    const data = await this.dataVisualisationService.getInadequateHousing(epcis)
    return {
      text: { ...commonData.baseLayout },
      charts: [
        {
          data: data[epciCode],
          templateImageFileName: 'image12.png',
          width: 700,
          height: 372,
          type: 'bad-housing',
        },
      ],
    }
  }

  private calculateSlide13Data(commonData: CommonSlideData) {
    return {
      text: {
        nb: `${commonData.data.selectedSimulations.length}`,
      },
    }
  }

  private calculateSlide14Data(commonData: CommonSlideData) {
    return {
      text: {
        ...commonData.baseLayout,
        horizon: `${commonData.baseLayout.layoutStart}-${commonData.baseLayout.layoutEnd}`,
        scenarioName: commonData.privilegedScenario.name,
        privilegedScenario: commonData.privilegedScenario.name,
        tendanciel: '150',
        acceleration: '200',
        default: '200',
        prin1: '100 000',
        prin2: '100 000',
        prin3: '100 000',
        menagesHorizon1: '100 000',
        menagesHorizon2: '100 000',
        menagesHorizon3: '100 000',
        vacance1: '100 000',
        vacance2: '100 000',
        rs1: '100 000',
        rs2: '100 000',
        resorb1: '100 000',
        resorb2: '100 000',
        resorb3: '100 000',
      },
    }
  }

  private calculateSlide15Data(commonData: CommonSlideData) {
    return {
      text: {
        ...commonData.baseLayout,
        start: commonData.baseLayout.layoutStart,
        end: commonData.baseLayout.layoutEnd,
        newHousing1: '1',
        newHousing2: '2',
        newHousing3: '3',
        demographic1: '1',
        demographic2: '1',
        demographic3: '1',
        fluidity1: '1',
        fluidity2: '1',
        fluidity3: '1',
        badHousing1: '1',
        badHousing2: '1',
        badHousing3: '1',
        secondary1: '1',
        secondary2: '1',
        secondary3: '1',
        housingNeeds1: '1',
        housingNeeds2: '1',
        housingNeeds3: '1',
        vacant1: '1',
        vacant2: '1',
        vacant3: '1',
        total1: '1',
        total2: '1',
        total3: '1',
      },
    }
  }

  private calculateSlide16Data(commonData: CommonSlideData) {
    return {
      text: {
        ...commonData.baseLayout,
        start: commonData.baseLayout.layoutStart,
        end: commonData.baseLayout.layoutEnd,
      },
    }
  }

  private calculateSlide17Data(commonData: CommonSlideData) {
    return {
      text: { ...commonData.baseLayout },
    }
  }

  private calculateSlide18Data(commonData: CommonSlideData) {
    const { privilegedScenario } = commonData
    return {
      text: {
        ...commonData.baseLayout,
        privilegedScenario: privilegedScenario.name,
      },
    }
  }

  private calculateSlide19Data(commonData: CommonSlideData) {
    return {
      text: {
        ...commonData.baseLayout,
        'docStart-1': String(Number(commonData.data.periodStart) - 1),
        docStart: commonData.data.periodStart,
        docEnd: commonData.data.periodEnd,
        docEnd2: String(Number(commonData.data.periodEnd) + 1),
        projection: '2050',
        total: '200',
        nb1: '1',
        nb2: '2',
        nb3: '3',
      },
    }
  }

  private calculateSlide20Data(commonData: CommonSlideData) {
    return {
      text: { ...commonData.baseLayout },
      // charts: [
      //   {
      //     data: [],
      //     templateImageFileName: 'image14.png',
      //     width: 650,
      //     height: 372,
      //   },
      // ],
    }
  }

  private calculateSlide21Data(commonData: CommonSlideData) {
    return {
      text: {
        ...commonData.baseLayout,
        nbNv: '200',
        nbFluid: '200',
        nbRs: '200',
        nbUrb: '200',
        nbVac: '200',
        nb: '200',
        projection: '200',
        total: '200',
        dperc: '200',
      },
    }
  }

  private calculateSlide22Data(commonData: CommonSlideData) {
    const { data } = commonData
    return {
      text: {
        ...commonData.baseLayout,
        nbHosted: '200',
        nbNoAccommodation: '200',
        nbBadQuality: '200',
        nbFinancialInadequation: '200',
        nbPhysicalInadequation: '200',
        percentHosted: '200',
        percentNoAcc: '200',
        percentBadQ: '200',
        percentFI: '200',
        percentPI: '200',
        resorbYear: '200',
        total: '200',
        nbSituations: '200',
        impact: '200',
        docStart: data.periodStart,
        docEnd: data.periodEnd,
      },
    }
  }

  private calculateSlide23Data(commonData: CommonSlideData) {
    return {
      text: { ...commonData.baseLayout },
      // charts: [
      //   {
      //     data: [],
      //     templateImageFileName: 'image15.png',
      //     width: 650,
      //     height: 372,
      //   },
      // ],
    }
  }

  private calculateSlide24Data(commonData: CommonSlideData) {
    return {
      text: { ...commonData.baseLayout },
    }
  }

  private calculateSlide25Data(commonData: CommonSlideData) {
    return {
      text: { ...commonData.baseLayout },
    }
  }

  private calculateSlide26Data(commonData: CommonSlideData) {
    return {
      text: { ...commonData.baseLayout },
    }
  }

  private calculateSlide27Data(commonData: CommonSlideData) {
    return {
      text: { ...commonData.baseLayout },
    }
  }

  private calculateSlide28Data(commonData: CommonSlideData) {
    return {
      text: { ...commonData.baseLayout },
    }
  }

  private calculateSlide30Data(commonData: CommonSlideData) {
    return {
      text: { ...commonData.baseLayout },
    }
  }

  private async generatePlaceholders(data: TRequestPowerpoint): Promise<TPowerpointPlaceholders> {
    const commonData = await this.prepareCommonData(data)
    const placeholders: Record<string, unknown> = {}

    for (const [slideKey, calculator] of Object.entries(this.slideCalculators)) {
      const result = calculator(commonData)
      placeholders[slideKey] = await result
    }

    return placeholders as TPowerpointPlaceholders
  }

  async generateFromTemplate(data: TRequestPowerpoint): Promise<Buffer> {
    // todo: use values from those
    // const simulations = await this.simulationsService.getMany(selectedSimulations)

    const zip = await this.zipService.unzipPptx()
    const slideFiles = Object.keys(zip.files).filter((name) => name.match(/^ppt\/slides\/slide\d+\.xml$/))

    for (const slideFile of slideFiles) {
      this.logger.log(`Processing slide ${slideFile}`)
      const slideName = slideFile.split('/').pop()!.replace('.xml', '')
      const slideXml = await zip.files[slideFile].async('text')
      const placeholders = await this.generatePlaceholders(data)

      const modifiedSlideXml = await this.placeholderService.processSlide(slideXml, slideName, placeholders, zip)
      zip.file(slideFile, modifiedSlideXml)
    }

    this.logger.log(`Generating PowerPoint file`)
    const pptxBuffer = await this.zipService.generatePptx(zip)
    // todo: mark simulations as exported
    // await this.simulationsService.markAsExported(data.simulations)
    return pptxBuffer
  }
}
