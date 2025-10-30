import { Injectable, Logger, Scope } from '@nestjs/common'
import { NeedsCalculationService } from '~/calculation/needs-calculation/needs-calculation.service'
import { DataVisualisationService } from '~/data-visualisation/data-visualisation.service'
import { DemographicEvolutionService } from '~/demographic-evolution/demographic-evolution.service'
import { EpcisService } from '~/epcis/epcis.service'
import { getOmphaleKey } from '~/export-excel/helpers/labels'
import { PlaceholderGenerationService } from '~/export-powerpoint/placeholder-generation/placeholder-generation.service'
import { ZipService } from '~/export-powerpoint/zip/zip.service'
import { RpInseeService } from '~/rp-insee/rp-insee.service'
import { TLayout, TPowerpointPlaceholders } from '~/schemas/export-powerpoint/export-powerpoint'
import { TResults } from '~/schemas/results/results'
import { TRequestPowerpoint, TSimulationWithEpciAndScenario } from '~/schemas/simulations/simulation'
import { SimulationsService } from '~/simulations/simulations.service'

interface CommonSlideData {
  baseLayout: TLayout
  privilegedScenario: TSimulationWithEpciAndScenario
  results: Record<string, TResults>
  epcis: Array<{ code: string; name: string; region: string; bassinName: string | null }>
  data: TRequestPowerpoint
  simulations: Array<TSimulationWithEpciAndScenario>
  mainEpci: { code: string; name: string }
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
    private readonly rpInseeService: RpInseeService,
  ) {}

  private readonly slideCalculators = {
    // slide1: this.calculateSlide1Data.bind(this),
    // slide2: this.calculateSlide2Data.bind(this),
    // slide4: this.calculateSlide4Data.bind(this),
    // slide6: this.calculateSlide6Data.bind(this),
    // slide8: this.calculateSlide8Data.bind(this),
    // slide9: this.calculateSlide9Data.bind(this),
    // slide10: this.calculateSlide10Data.bind(this),
    // slide11: this.calculateSlide11Data.bind(this),
    // slide12: this.calculateSlide12Data.bind(this),
    // slide13: this.calculateSlide13Data.bind(this),
    // slide14: this.calculateSlide14Data.bind(this),
    // slide15: this.calculateSlide15Data.bind(this),
    slide16: this.calculateSlide16Data.bind(this),
    // slide17: this.calculateSlide17Data.bind(this),
    // slide18: this.calculateSlide18Data.bind(this),
    // slide19: this.calculateSlide19Data.bind(this),
    // slide20: this.calculateSlide20Data.bind(this),
    // slide21: this.calculateSlide21Data.bind(this),
    // slide22: this.calculateSlide22Data.bind(this),
    // slide23: this.calculateSlide23Data.bind(this),
    // slide24: this.calculateSlide24Data.bind(this),
    // slide25: this.calculateSlide25Data.bind(this),
    // slide26: this.calculateSlide26Data.bind(this),
    // slide27: this.calculateSlide27Data.bind(this),
    // slide28: this.calculateSlide28Data.bind(this),
    // slide30: this.calculateSlide30Data.bind(this),
  }

  private async prepareCommonData(data: TRequestPowerpoint): Promise<CommonSlideData> {
    const simulations = await this.simulationService.getMany(data.selectedSimulations)
    const bassinEpcis = await this.epcisService.getBassinEpcisByEpciCode(data.epci.code)
    const epcis = bassinEpcis.map((epci) => ({
      code: epci.code,
      name: epci.name,
      region: epci.region,
      bassinName: epci.bassinName,
    }))
    const privilegedScenario = await this.simulationService.get(data.privilegedSimulation)

    const simulationPromises = simulations.map(async (simulation) => ({
      id: simulation.id,
      result: await this.needsCalculationService.calculate(simulation),
    }))

    const results = (await Promise.all(simulationPromises)).reduce((acc, { id, result }) => {
      acc[id] = result
      return acc
    }, {})

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
      simulations,
      results,
      epcis,
      mainEpci: data.epci,
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
    const { results, baseLayout, data, privilegedScenario } = commonData
    const epciFlowRequirement = results[privilegedScenario.id].flowRequirement.epcis.find((epci) => epci.code === data.epci.code)
    const epcisTotals = results[privilegedScenario.id].epcisTotals.find((epci) => epci.epciCode === data.epci.code)

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

    let percentMenages = ''
    let percentBadHousing = ''
    let percentFluidity = ''

    if (epciFlowRequirement && epcisTotals) {
      epciFlowRequirement.totals.vacantAccomodation
      percentMenages = ((epciFlowRequirement.totals.demographicEvolution / epcisTotals.totalFlux) * 100).toFixed(1)
      percentBadHousing = ((epcisTotals.totalStock / epcisTotals.total) * 100).toFixed(1)
      percentFluidity = ((epciFlowRequirement.totals.vacantAccomodation / epcisTotals.totalFlux) * 100).toFixed(1)
    }

    return {
      text: {
        ...baseLayout,
        start: baseLayout.layoutStart,
        end: baseLayout.layoutEnd,
        nb: nbSupp.toString(),
        nbNew: nbNew.toString(),
        nbSupp: (nbNew + nbSupp).toString(),
        percentMenages,
        nbMenages: epciFlowRequirement?.totals.demographicEvolution.toString() || '0',
        percentBadHousing,
        nbResorption: epcisTotals?.totalStock.toString() || '0',
        percentFluidity,
        peakYear: baseLayout.layoutEnd,
        privilegedScenario: commonData.privilegedScenario.name,
        orgName: data.username,
      },
    }
  }

  private calculateSlide6Data(commonData: CommonSlideData) {
    return {
      text: { ...commonData.baseLayout, territory: commonData.data.epci.name },
    }
  }

  private async calculateSlide8Data(commonData: CommonSlideData) {
    const { results, privilegedScenario } = commonData
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

    const flowRequirement = results[privilegedScenario.id].flowRequirement.epcis.find((epci) => epci.code === commonData.data.epci.code)
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

  private async calculateSlide14Data(commonData: CommonSlideData) {
    const { data, simulations, privilegedScenario } = commonData
    const epciCode = data.epci.code

    const centralSimulation = simulations.find((sim) => sim.scenario.b2_scenario.startsWith('Central'))

    let scenarioName1 = ''
    let tendanciel = ''
    let prin1 = ''
    let vacance1 = ''
    let rs1 = ''
    let resorb1 = ''

    let prin2 = ''
    let vacance2 = ''
    let rs2 = ''
    let resorb2 = ''

    // Variables for last simulation (suffix 3)
    let prin3 = ''
    let resorb3 = ''

    if (centralSimulation) {
      scenarioName1 = centralSimulation.name

      const epcis = commonData.epcis.filter((epci) => epci.code === epciCode)
      const demographicData = await this.demographicEvolutionService.getDemographicEvolutionPopulationByEpci(epciCode)
      const projectionYear = centralSimulation.scenario.projection

      if (demographicData[epciCode]) {
        const yearData = demographicData[epciCode].data.find((d) => d.year === projectionYear)
        tendanciel = yearData ? yearData.central.toString() : '150'
      }

      const scenario = centralSimulation.scenario.b2_scenario
      const scenarioPrefix = scenario.split('_')[0]
      let selectedDemographicEvolution = 'central'

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

      const demographicEvolutionData = await this.demographicEvolutionService.getDemographicEvolutionOmphaleAndYear(
        epcis,
        selectedDemographicEvolution,
      )
      if (demographicEvolutionData.linearChart && demographicEvolutionData.linearChart[epciCode]) {
        const yearData = demographicEvolutionData.linearChart[epciCode].find((d) => d.year === projectionYear)
        prin1 = yearData ? yearData[getOmphaleKey(scenario)].toString() : ''
      }

      const epciScenario = centralSimulation.scenario.epciScenarios.find((es) => es.epciCode === epciCode)
      if (epciScenario) {
        vacance1 = epciScenario.b2_tx_vacance_longue.toString()
        rs1 = epciScenario.b2_tx_rs.toString()
      }

      resorb1 = centralSimulation.scenario.b1_horizon_resorption.toString()
    }

    const privilegedSimulationData = simulations.find((sim) => sim.id === privilegedScenario.id)
    if (privilegedSimulationData) {
      const epcis = commonData.epcis.filter((epci) => epci.code === epciCode)
      const privilegedProjectionYear = privilegedSimulationData.scenario.projection
      const privilegedScenario2 = privilegedSimulationData.scenario.b2_scenario
      const privilegedScenarioPrefix = privilegedScenario2.split('_')[0]
      let privilegedDemographicEvolution = 'central'

      switch (privilegedScenarioPrefix) {
        case 'PH':
          privilegedDemographicEvolution = 'haute'
          break
        case 'PB':
          privilegedDemographicEvolution = 'basse'
          break
        case 'PC':
        default:
          privilegedDemographicEvolution = 'central'
          break
      }

      const privilegedDemographicEvolutionData = await this.demographicEvolutionService.getDemographicEvolutionOmphaleAndYear(
        epcis,
        privilegedDemographicEvolution,
      )
      if (privilegedDemographicEvolutionData.linearChart && privilegedDemographicEvolutionData.linearChart[epciCode]) {
        const yearData = privilegedDemographicEvolutionData.linearChart[epciCode].data.find((d) => d.year === privilegedProjectionYear)

        prin2 = yearData ? yearData[getOmphaleKey(privilegedScenario2)].toString() : ''
      }

      const privilegedEpciScenario = privilegedSimulationData.scenario.epciScenarios.find((es) => es.epciCode === epciCode)
      if (privilegedEpciScenario) {
        vacance2 = privilegedEpciScenario.b2_tx_vacance_longue.toString()
        rs2 = privilegedEpciScenario.b2_tx_rs.toString()
      }
      resorb2 = privilegedSimulationData.scenario.b1_horizon_resorption.toString()
    }

    const lastSimulation = simulations.filter((sim) => sim.id !== centralSimulation?.id && sim.id !== privilegedScenario.id).slice(-1)[0]

    if (lastSimulation) {
      const epcis = commonData.epcis.filter((epci) => epci.code === epciCode)
      const lastProjectionYear = lastSimulation.scenario.projection

      const lastScenario = lastSimulation.scenario.b2_scenario
      const lastScenarioPrefix = lastScenario.split('_')[0]
      let lastDemographicEvolution = 'central'

      switch (lastScenarioPrefix) {
        case 'PH':
          lastDemographicEvolution = 'haute'
          break
        case 'PB':
          lastDemographicEvolution = 'basse'
          break
        case 'PC':
        default:
          lastDemographicEvolution = 'central'
          break
      }

      const lastDemographicEvolutionData = await this.demographicEvolutionService.getDemographicEvolutionOmphaleAndYear(
        epcis,
        lastDemographicEvolution,
      )
      if (lastDemographicEvolutionData.linearChart && lastDemographicEvolutionData.linearChart[epciCode]) {
        const yearData = lastDemographicEvolutionData.linearChart[epciCode].data.find((d) => d.year === lastProjectionYear)
        prin3 = yearData ? yearData[getOmphaleKey(lastScenario)].toString() : ''
      }

      // resorb3: b1_horizon_resorption
      resorb3 = lastSimulation.scenario.b1_horizon_resorption.toString()
    }

    return {
      text: {
        ...commonData.baseLayout,
        horizon: `${commonData.baseLayout.layoutStart}-${commonData.baseLayout.layoutEnd}`,
        scenarioName1,
        scenarioName3: privilegedScenario.name,
        scenarioName2: privilegedScenario.name,
        tendanciel,
        acceleration: '200',
        default: '200',
        prin1,
        prin2,
        prin3,
        menagesHorizon1: '100 000',
        menagesHorizon2: '100 000',
        menagesHorizon3: '100 000',
        vacance1,
        vacance2,
        rs1,
        rs2,
        resorb1,
        resorb2,
        resorb3,
      },
    }
  }

  private async calculateSlide15Data(commonData: CommonSlideData) {
    const { data, simulations, results, privilegedScenario } = commonData
    const epciCode = data.epci.code

    const centralSimulation = simulations.find((sim) => sim.scenario.b2_scenario.startsWith('Central'))

    let demographic1 = ''
    let fluidity1 = ''
    let secondary1 = ''
    let housingNeeds1 = ''
    let vacant1 = ''
    let total1 = ''
    let newHousing1 = ''
    let demographic2 = ''
    let fluidity2 = ''
    let secondary2 = ''
    let housingNeeds2 = ''
    let vacant2 = ''
    let total2 = ''
    let newHousing2 = ''

    const flowRequirement = results[privilegedScenario.id].flowRequirement.epcis.find((epci) => epci.code === epciCode)

    if (centralSimulation && flowRequirement) {
      demographic1 = flowRequirement.totals.demographicEvolution.toString()
      fluidity1 = flowRequirement.totals.vacantAccomodation.toString()
      secondary1 = flowRequirement.totals.secondaryResidenceAccomodationEvolution.toString()
      housingNeeds1 = flowRequirement.totals.housingNeeds.toString()
      vacant1 = flowRequirement.totals.shortTermVacantAccomodation.toString()
      total1 = (
        flowRequirement.totals.demographicEvolution +
        flowRequirement.totals.vacantAccomodation +
        flowRequirement.totals.housingNeeds
      ).toString()

      const startYear = parseInt(data.periodStart)
      const endYear = parseInt(data.periodEnd)
      let housingSum = 0

      for (let year = startYear; year <= endYear; year++) {
        const yearStr = year.toString()
        housingSum += flowRequirement.data.housingNeeds[yearStr] || 0
      }

      newHousing1 = housingSum.toString()
    }

    if (flowRequirement) {
      demographic2 = flowRequirement.totals.demographicEvolution.toString()
      fluidity2 = flowRequirement.totals.vacantAccomodation.toString()
      secondary2 = flowRequirement.totals.secondaryResidenceAccomodationEvolution.toString()
      housingNeeds2 = flowRequirement.totals.housingNeeds.toString()
      vacant2 = flowRequirement.totals.longTermVacantAccomodation.toString()
      total2 = (
        flowRequirement.totals.demographicEvolution +
        flowRequirement.totals.vacantAccomodation +
        flowRequirement.totals.housingNeeds
      ).toString()

      const startYear = parseInt(data.periodStart)
      const endYear = parseInt(data.periodEnd)
      let housingSum = 0

      for (let year = startYear; year <= endYear; year++) {
        const yearStr = year.toString()
        housingSum += flowRequirement.data.housingNeeds[yearStr] || 0
      }

      newHousing2 = housingSum.toString()
    }

    return {
      text: {
        ...commonData.baseLayout,
        start: commonData.baseLayout.layoutStart,
        end: commonData.baseLayout.layoutEnd,
        newHousing1,
        newHousing2,
        newHousing3: '3',
        demographic1,
        demographic2,
        demographic3: '1',
        fluidity1,
        fluidity2,
        fluidity3: '1',
        badHousing1: '1',
        badHousing2: '1',
        badHousing3: '1',
        secondary1,
        secondary2,
        secondary3: '1',
        housingNeeds1,
        housingNeeds2,
        housingNeeds3: '1',
        vacant1,
        vacant2,
        vacant3: '1',
        total1,
        total2,
        total3: '1',
      },
    }
  }

  private calculateSlide16Data(commonData: CommonSlideData) {
    const { results } = commonData
    return {
      text: {
        ...commonData.baseLayout,
        start: commonData.baseLayout.layoutStart,
        end: commonData.baseLayout.layoutEnd,
      },
      charts: [
        {
          data: results,
          templateImageFileName: 'image13.png',
          width: 620,
          height: 350,
          type: 'annual-needs-comparison',
        },
      ],
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
    const { data, results, privilegedScenario } = commonData
    const epciCode = data.epci.code

    // Get flow requirement data for this EPCI
    const flowRequirement = results[privilegedScenario.id].flowRequirement.epcis.find((epci) => epci.code === epciCode)

    const startYear = parseInt(data.periodStart)
    const endYear = parseInt(data.periodEnd)
    const projectionYear = privilegedScenario.scenario.projection

    let nb1 = 0 // Sum from 2021 to docStart-1
    let nb2Sum = 0 // Sum from docStart to docEnd (for average calculation)
    let nb2Count = 0 // Count of years for average
    let nb3 = 0 // Sum from docEnd+1 to projection

    if (flowRequirement) {
      // nb1: Sum from 2021 to docStart-1
      for (let year = 2021; year < startYear; year++) {
        const yearStr = year.toString()
        nb1 += flowRequirement.data.housingNeeds[yearStr] || 0
      }

      // nb2: Calculate sum for docStart to docEnd (will calculate average later)
      for (let year = startYear; year <= endYear; year++) {
        const yearStr = year.toString()
        nb2Sum += flowRequirement.data.housingNeeds[yearStr] || 0
        nb2Count++
      }

      // nb3: Sum from docEnd+1 to projection
      for (let year = endYear + 1; year <= projectionYear; year++) {
        const yearStr = year.toString()
        nb3 += flowRequirement.data.housingNeeds[yearStr] || 0
      }
    }

    // Calculate average for nb2
    const nb2 = nb2Count > 0 ? Math.round(nb2Sum / nb2Count) : 0

    // Total is the sum from docStart to docEnd
    const total = nb2Sum

    return {
      text: {
        ...commonData.baseLayout,
        'docStart-1': String(startYear - 1),
        docStart: data.periodStart,
        docEnd: data.periodEnd,
        docEnd2: String(endYear + 1),
        projection: projectionYear.toString(),
        total: total.toString(),
        nb1: nb1.toString(),
        nb2: nb2.toString(),
        nb3: nb3.toString(),
      },
    }
  }

  private calculateSlide20Data(commonData: CommonSlideData) {
    const { privilegedScenario, mainEpci, results } = commonData
    const sitadelResults = results[privilegedScenario.id].sitadel.epcis.find((e) => e.code === mainEpci.code)
    const newConstructionsResults = results[privilegedScenario.id].flowRequirement.epcis.find((e) => e.code === mainEpci.code)

    const data = {
      sitadelData: sitadelResults?.data || [],
      newConstructionsData: newConstructionsResults?.data || [],
      horizon: privilegedScenario.scenario.projection,
    }

    return {
      text: { ...commonData.baseLayout },
      charts: [
        {
          data,
          templateImageFileName: 'image14.png',
          width: 620,
          height: 350,
          type: 'annual-needs',
        },
      ],
    }
  }

  private calculateSlide21Data(commonData: CommonSlideData) {
    const { data, results, privilegedScenario } = commonData
    const epciCode = data.epci.code

    // Get flow requirement data for this EPCI
    const flowRequirement = results[privilegedScenario.id].flowRequirement.epcis.find((epci) => epci.code === epciCode)

    // Calculate nb by summing housingNeeds from docStart to projection year
    let nb = 0
    if (flowRequirement) {
      const startYear = parseInt(data.periodStart)
      const projectionYear = privilegedScenario.scenario.projection

      for (let year = startYear; year <= projectionYear; year++) {
        const yearStr = year.toString()
        nb += flowRequirement.data.housingNeeds[yearStr] || 0
      }
    }

    return {
      text: {
        ...commonData.baseLayout,
        nbNv: '200',
        nbFluid: '200',
        nbRs: '200',
        nbUrb: '200',
        nbVac: '200',
        nb: nb.toString(),
        projection: privilegedScenario.scenario.projection.toString(),
        total: '200',
        dperc: '200',
      },
    }
  }

  private calculateSlide22Data(commonData: CommonSlideData) {
    const { data, results, privilegedScenario } = commonData
    const epciCode = data.epci.code

    // Get prorata values from results
    const hostedEpci = results[privilegedScenario.id].hosted.epcis.find((epci) => epci.epciCode === epciCode)
    const noAccommodationEpci = results[privilegedScenario.id].noAccomodation.epcis.find((epci) => epci.epciCode === epciCode)
    const badQualityEpci = results[privilegedScenario.id].badQuality.epcis.find((epci) => epci.epciCode === epciCode)
    const financialInadequationEpci = results[privilegedScenario.id].financialInadequation.epcis.find((epci) => epci.epciCode === epciCode)
    const physicalInadequationEpci = results[privilegedScenario.id].physicalInadequation.epcis.find((epci) => epci.epciCode === epciCode)

    // Get total stock for percentage calculations
    const epciTotal = results[privilegedScenario.id].epcisTotals.find((epci) => epci.epciCode === epciCode)
    const totalStock = epciTotal?.totalStock || 1 // Avoid division by zero

    // Extract prorata values
    const nbHosted = hostedEpci?.prorataValue || 0
    const nbNoAccommodation = noAccommodationEpci?.prorataValue || 0
    const nbBadQuality = badQualityEpci?.prorataValue || 0
    const nbFinancialInadequation = financialInadequationEpci?.prorataValue || 0
    const nbPhysicalInadequation = physicalInadequationEpci?.prorataValue || 0

    // Calculate percentages
    const percentHosted = ((nbHosted / totalStock) * 100).toFixed(1)
    const percentNoAcc = ((nbNoAccommodation / totalStock) * 100).toFixed(1)
    const percentBadQ = ((nbBadQuality / totalStock) * 100).toFixed(1)
    const percentFI = ((nbFinancialInadequation / totalStock) * 100).toFixed(1)
    const percentPI = ((nbPhysicalInadequation / totalStock) * 100).toFixed(1)

    // Get resorbYear from scenario
    const resorbYear = privilegedScenario.scenario.b1_horizon_resorption

    // Calculate totals
    const totalSituations = nbHosted + nbNoAccommodation + nbBadQuality + nbFinancialInadequation + nbPhysicalInadequation

    return {
      text: {
        ...commonData.baseLayout,
        nbHosted: nbHosted.toString(),
        nbNoAccommodation: nbNoAccommodation.toString(),
        nbBadQuality: nbBadQuality.toString(),
        nbFinancialInadequation: nbFinancialInadequation.toString(),
        nbPhysicalInadequation: nbPhysicalInadequation.toString(),
        percentHosted,
        percentNoAcc,
        percentBadQ,
        percentFI,
        percentPI,
        resorbYear: resorbYear.toString(),
        total: totalStock.toString(),
        nbSituations: totalSituations.toString(),
        impact: '200', // This value needs clarification - keeping original
        docStart: data.periodStart,
        docEnd: data.periodEnd,
      },
    }
  }

  private async calculateSlide23Data(commonData: CommonSlideData) {
    const epciCode = commonData.data.epci.code
    const epcis = commonData.epcis.filter((epci) => epci.code === epciCode)
    const data = await this.rpInseeService.getRP(epcis, 'vacant')

    return {
      text: { ...commonData.baseLayout },
      charts: [
        {
          data,
          templateImageFileName: 'image15.png',
          width: 650,
          height: 325,
          type: 'vacant-accommodation',
        },
      ],
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
