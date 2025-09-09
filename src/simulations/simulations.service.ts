import { Injectable } from '@nestjs/common'
import { Simulation } from '@prisma/client'
import * as ExcelJS from 'exceljs'
import { PrismaService } from '~/db/prisma.service'
import { EpciGroupsService } from '~/epci-groups/epci-groups.service'
import { ScenariosService } from '~/scenarios/scenarios.service'
import { TUpdateSimulationDto } from '~/schemas/scenarios/scenario'
import { TInitSimulation } from '~/schemas/simulations/create-simulation'
import { TCloneSimulationDto, TSimulationWithEpci, TSimulationWithEpciAndScenario } from '~/schemas/simulations/simulation'
@Injectable()
export class SimulationsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly scenariosService: ScenariosService,
    private readonly epciGroupsService: EpciGroupsService,
  ) {}

  async hasUserAccessTo(id: string, userId: string): Promise<boolean> {
    return !!(await this.prismaService.simulation.findFirst({
      where: { id, userId },
    }))
  }

  async list(userId: string): Promise<TSimulationWithEpci[]> {
    const simulations = await this.prismaService.simulation.findMany({
      select: {
        createdAt: true,
        name: true,
        epcis: { select: { code: true, name: true, region: true, bassinName: true } },
        scenario: { select: { b2_scenario: true, projection: true } },
        id: true,
        updatedAt: true,
        epciGroup: { select: { id: true, name: true } },
      },
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    })

    return simulations.map((simulation) => ({
      ...simulation,
      epciGroup: simulation.epciGroup || undefined,
    }))
  }

  async get(id: string): Promise<TSimulationWithEpciAndScenario> {
    const simulation = await this.prismaService.simulation.findUniqueOrThrow({
      include: {
        epcis: { select: { code: true, name: true, bassinName: true } },
        scenario: { include: { demographicEvolutionOmphaleCustom: true } },
      },
      where: { id },
    })
    const scenario = await this.scenariosService.get(simulation.scenario.id)

    const sortedEpcis = simulation.epcis.sort((a, b) => {
      const aScenario = scenario.epciScenarios.find((s) => s.epciCode === a.code)
      const bScenario = scenario.epciScenarios.find((s) => s.epciCode === b.code)

      if (!aScenario || !bScenario) return 0
      if (aScenario.baseEpci === bScenario.baseEpci) return 0
      return aScenario.baseEpci ? -1 : 1
    })

    return {
      name: simulation.name,
      createdAt: simulation.createdAt,
      epcis: sortedEpcis,
      id: simulation.id,
      scenario: scenario as TSimulationWithEpciAndScenario['scenario'],
      updatedAt: simulation.updatedAt,
    }
  }

  async getMany(ids: string[]): Promise<TSimulationWithEpciAndScenario[]> {
    const simulations = await this.prismaService.simulation.findMany({
      include: {
        epcis: { select: { code: true, name: true, bassinName: true } },
        scenario: { include: { epciScenarios: true, demographicEvolutionOmphaleCustom: true } },
      },
      where: { id: { in: ids } },
    })

    return simulations as TSimulationWithEpciAndScenario[]
  }

  async getScenario(id: string) {
    const simulation = await this.prismaService.simulation.findUniqueOrThrow({
      include: { scenario: { select: { id: true } } },
      where: { id },
    })
    const scenario = await this.scenariosService.get(simulation.scenario.id)
    return { id, scenario }
  }

  async create(userId: string, data: TInitSimulation): Promise<Simulation> {
    const scenario = await this.scenariosService.create(userId, data.scenario)

    let epciGroupId = data.epciGroupId

    if (data.epciGroupName && !epciGroupId) {
      const epciGroup = await this.epciGroupsService.create(userId, {
        name: data.epciGroupName,
        epciCodes: data.epci.map((epci) => epci.code),
      })
      epciGroupId = epciGroup.id
    }

    return this.prismaService.simulation.create({
      data: {
        epcis: {
          connect: data.epci.map((epci) => ({ code: epci.code })),
        },
        name: data.name,
        scenario: { connect: { id: scenario.id } },
        user: { connect: { id: userId } },
        ...(epciGroupId && { epciGroup: { connect: { id: epciGroupId } } }),
      },
    })
  }

  async update(id: string, data: TUpdateSimulationDto): Promise<TSimulationWithEpciAndScenario> {
    await this.scenariosService.update(data.id, data)
    return this.get(id)
  }

  async delete(userId: string, id: string): Promise<Simulation> {
    return this.prismaService.simulation.delete({
      where: { id, userId },
    })
  }

  async clone(userId: string, originalId: string, data: TCloneSimulationDto): Promise<Simulation> {
    const originalSimulation = await this.prismaService.simulation.findUniqueOrThrow({
      include: {
        scenario: { include: { epciScenarios: true } },
        epcis: { select: { code: true } },
      },
      where: { id: originalId, userId },
    })

    const { userId: _, id, ...scenarioData } = originalSimulation.scenario

    const clonedScenario = await this.scenariosService.create(userId, {
      ...scenarioData,
      epcis: originalSimulation.scenario.epciScenarios.reduce((acc, epciScenario) => {
        acc[epciScenario.epciCode] = {
          b2_tx_rs: epciScenario.b2_tx_rs,
          b2_tx_vacance: epciScenario.b2_tx_vacance,
          b2_tx_vacance_longue: epciScenario.b2_tx_vacance_longue,
          b2_tx_vacance_courte: epciScenario.b2_tx_vacance_courte,
          b2_tx_disparition: epciScenario.b2_tx_disparition,
          b2_tx_restructuration: epciScenario.b2_tx_restructuration,
          baseEpci: epciScenario.baseEpci,
        }
        return acc
      }, {}),
    })

    return this.prismaService.simulation.create({
      data: {
        name: data.name,
        epcis: {
          connect: originalSimulation.epcis.map((epci) => ({ code: epci.code })),
        },
        scenario: { connect: { id: clonedScenario.id } },
        user: { connect: { id: userId } },
        ...(originalSimulation.epciGroupId && { epciGroup: { connect: { id: originalSimulation.epciGroupId } } }),
      },
    })
  }

  async exportScenario(id: string) {
    const workbook = new ExcelJS.Workbook()

    const simulation = await this.prismaService.simulation.findUniqueOrThrow({
      include: { scenario: { include: { epciScenarios: true } } },
      where: { id },
    })

    const globalWorksheet = workbook.addWorksheet('Parametrage global', { properties: { defaultColWidth: 30 } })
    globalWorksheet.columns = [
      { header: 'Période de projection', key: 'projection' },
      { header: 'Horizon de résorption (en années)', key: 'b1_horizon_resorption' },
      { header: 'Scénario démographique Omphale', key: 'b2_scenario' },
      { header: 'Source - hors logement', key: 'source_b11' },
      { header: "Type d'hébergement - hors logement", key: 'b11_etablissement' },
      { header: 'Part prise en compte - hors logement', key: 'b11_part_etablissement' },
      { header: 'Source - Inadéquation financière', key: 'source_b14' },
      { header: 'Confort - Inadéquation financière', key: 'b14_confort' },
      { header: "Statut d'occupation - Inadéquation financière", key: 'b14_occupation' },
      { header: 'Part de logements réallouées - Inadéquation financière', key: 'b14_taux_reallocation' },
      { header: 'Source - Mauvaise qualité', key: 'source_b15' },
      { header: 'Niveau de suroccupation - Mauvaise qualité', key: 'b15_surocc' },
      { header: 'Catégories - Mauvaise qualité', key: 'b15_loc_hors_hlm' },
      { header: 'Part de logements réallouées - Mauvaise qualité', key: 'b15_taux_reallocation' },
      { header: 'Source - Suroccupation', key: 'source_b15' },
      { header: 'Niveau de suroccupation - Suroccupation', key: 'b15_surocc' },
      { header: 'Catégories - Suroccupation', key: 'b15_loc_hors_hlm' },
      { header: 'Part de logements réallouées - Suroccupation', key: 'b15_taux_reallocation' },
    ]

    globalWorksheet.addRow({
      projection: simulation.scenario.projection,
      b1_horizon_resorption: simulation.scenario.b1_horizon_resorption,
      b2_scenario: simulation.scenario.b2_scenario,
      source_b11: simulation.scenario.source_b11,
      b11_etablissement: simulation.scenario.b11_etablissement?.join(','),
      b11_part_etablissement: simulation.scenario.b11_part_etablissement,
      source_b14: simulation.scenario.source_b14,
      b14_confort: simulation.scenario.b14_confort,
      b14_occupation: simulation.scenario.b14_occupation,
      b14_taux_reallocation: simulation.scenario.b14_taux_reallocation,
      source_b15: simulation.scenario.source_b15,
      b15_surocc: simulation.scenario.b15_surocc,
      b15_loc_hors_hlm: simulation.scenario.b15_loc_hors_hlm,
      b15_taux_reallocation: simulation.scenario.b15_taux_reallocation,
    })

    for (const epciScenario of simulation.scenario.epciScenarios) {
      const simulationResults = await this.prismaService.simulationResults.findUniqueOrThrow({
        where: { epciCode_simulationId: { epciCode: epciScenario.epciCode, simulationId: id } },
      })
      const epciWorksheet = workbook.addWorksheet(epciScenario.epciCode, { properties: { defaultColWidth: 30 } })
      epciWorksheet.columns = [
        { header: 'Taux cible de logement vacants', key: 'b2_tx_vacance' },
        { header: 'Taux cible de residences secondaires', key: 'b2_tx_rs' },
        { header: 'Taux cible de disparition', key: 'b2_tx_disparition' },
        { header: 'Taux cible de restructuration', key: 'b2_tx_restructuration' },
      ]

      epciWorksheet.addRow({
        b2_tx_vacance: epciScenario.b2_tx_vacance,
        b2_tx_rs: epciScenario.b2_tx_rs,
        b2_tx_disparition: epciScenario.b2_tx_disparition,
        b2_tx_restructuration: epciScenario.b2_tx_restructuration,
      })

      // we skip 2 rows
      epciWorksheet.addRow({})
      epciWorksheet.addRow({})

      epciWorksheet.addRow({
        b2_tx_vacance: 'Besoin en constructions neuves',
        b2_tx_rs: simulationResults.totalFlux + simulationResults.totalStock,
      })
      epciWorksheet.addRow({ b2_tx_vacance: 'Besoin en remobilisation', b2_tx_rs: simulationResults.vacantAccomodation })
      epciWorksheet.addRow({ b2_tx_vacance: 'Besoin en mal-logement', b2_tx_rs: simulationResults.totalStock })
    }

    return workbook
  }

  /**
   * Gets the list of simulations for a user and groups them by their epciGroup ID.
   */
  async getDashboardList(userId: string) {
    const simulations = await this.list(userId)

    // Group simulations by their epciGroup ID
    const groupedSimulations: Array<{
      id: string
      name: string
      simulations: TSimulationWithEpci[]
    }> = []

    // First, group by epciGroup ID or 'autres' for ungrouped
    const simulationsByGroupId: Record<string, TSimulationWithEpci[]> = {}

    simulations.forEach((simulation) => {
      const groupId = simulation.epciGroup?.id || 'autres'
      simulationsByGroupId[groupId] = simulationsByGroupId[groupId] || []
      simulationsByGroupId[groupId].push(simulation)
    })

    // Convert to array format with proper structure
    Object.entries(simulationsByGroupId).forEach(([groupId, sims]) => {
      if (groupId === 'autres') {
        groupedSimulations.push({
          id: 'autres',
          name: 'Autres',
          simulations: sims,
        })
      } else {
        // Get the group name from any simulation in this group
        const groupName = sims[0].epciGroup?.name || 'Unknown'
        groupedSimulations.push({
          id: groupId,
          name: groupName,
          simulations: sims,
        })
      }
    })

    return groupedSimulations
  }

  async markAsExported(simulationIds: string[]): Promise<void> {
    await this.prismaService.simulation.updateMany({
      where: {
        id: {
          in: simulationIds,
        },
      },
      data: {
        exported: true,
      },
    })
  }
}
