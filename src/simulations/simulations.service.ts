import { Injectable } from '@nestjs/common'
import { Simulation } from '@prisma/client'
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
      },
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    })

    return simulations
  }

  async get(id: string): Promise<TSimulationWithEpciAndScenario> {
    const simulation = await this.prismaService.simulation.findUniqueOrThrow({
      include: {
        epcis: { select: { code: true, name: true, bassinName: true } },
        scenario: { include: { epciScenarios: true } },
      },
      where: { id },
    })

    return {
      name: simulation.name,
      createdAt: simulation.createdAt,
      epcis: simulation.epcis,
      id: simulation.id,
      scenario: simulation.scenario as TSimulationWithEpciAndScenario['scenario'],
      updatedAt: simulation.updatedAt,
    }
  }

  async getMany(ids: string[]): Promise<TSimulationWithEpciAndScenario[]> {
    const simulations = await this.prismaService.simulation.findMany({
      include: {
        epcis: { select: { code: true, name: true, bassinName: true } },
        scenario: { include: { epciScenarios: true } },
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

    // Handle EPCI group creation if needed
    if (data.epciGroupName && !epciGroupId) {
      // Create a new EPCI group with the provided name
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
    // Get the original simulation with scenario and epcis
    const originalSimulation = await this.prismaService.simulation.findUniqueOrThrow({
      include: {
        scenario: { include: { epciScenarios: true } },
        epcis: { select: { code: true } },
      },
      where: { id: originalId, userId },
    })

    const { userId: _, id, ...scenarioData } = originalSimulation.scenario

    // Clone the scenario (deep copy)
    const clonedScenario = await this.scenariosService.create(userId, {
      ...scenarioData,
      epcis: originalSimulation.scenario.epciScenarios.reduce((acc, epciScenario) => {
        acc[epciScenario.epciCode] = {
          b2_tx_rs: epciScenario.b2_tx_rs,
          b2_tx_vacance: epciScenario.b2_tx_vacance,
          b2_tx_disparition: epciScenario.b2_tx_disparition,
          b2_tx_restructuration: epciScenario.b2_tx_restructuration,
        }
        return acc
      }, {}),
    })

    // Create the new simulation
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
    const DELIMITER = ';'
    const simulation = await this.prismaService.simulation.findUniqueOrThrow({
      include: { scenario: { include: { epciScenarios: true } } },
      where: { id },
    })

    const csvRows: string[] = []
    csvRows.push(
      [
        'EPCI',
        'Période de projection',
        'Horizon de résorption (en années)',
        'Scénario démographique Omphale',
        'Taux cible de logement vacants',
        'Taux cible de résidences secondaires',
        'Taux cible de disparition',
        'Taux cible de restructuration',
        'Source - hors logement',
        "Type d'hébergement - hors logement",
        'Part prise en compte - hors logement',
        'Part prise en compte - Hébergés',
        "Type d'hébergement - Hébergés",
        'Taux net maximal - Inadéquation financière',
        'Catégories - Inadéquation financière',
        'Part de logements réallouées - Inadéquation financière',
        'Source - Mauvaise qualité',
        'Confort - Mauvaise qualité',
        "Statut d'occupation - Mauvaise qualité",
        'Part de logements réallouées - Mauvaise qualité',
        'Source - Suroccupation',
        'Niveau de suroccupation - Suroccupation',
        'Catégories - Suroccupation',
        'Part de logements réallouées - Suroccupation',
      ].join(DELIMITER),
    )

    for (const epciScenario of simulation.scenario.epciScenarios) {
      const row = [
        epciScenario.epciCode,
        simulation.scenario.projection,
        simulation.scenario.b1_horizon_resorption,
        simulation.scenario.b2_scenario,
        epciScenario.b2_tx_vacance,
        epciScenario.b2_tx_rs,
        epciScenario.b2_tx_disparition,
        epciScenario.b2_tx_restructuration,
        simulation.scenario.source_b11,
        simulation.scenario.b11_etablissement.join(','),
        simulation.scenario.b11_part_etablissement,
        simulation.scenario.source_b11,
        simulation.scenario.b11_etablissement.join(','),
        simulation.scenario.b11_part_etablissement,
        simulation.scenario.b12_cohab_interg_subie,
        [
          simulation.scenario.b12_heberg_gratuit ? 'Logés à titre gratuit' : null,
          simulation.scenario.b12_heberg_particulier ? 'Logés chez un particulier' : null,
          simulation.scenario.b12_heberg_temporaire ? 'Logés temporairement' : null,
        ]
          .filter(Boolean)
          .join(', '),
        simulation.scenario.b13_taux_effort,
        simulation.scenario.b13_acc ? 'ACC' : simulation.scenario.b13_plp ? 'PLP' : '',
        simulation.scenario.b13_taux_reallocation,
        simulation.scenario.source_b14,
        simulation.scenario.b14_confort,
        simulation.scenario.b14_occupation,
        simulation.scenario.b14_taux_reallocation,
        simulation.scenario.source_b15,
        simulation.scenario.b15_surocc,
        simulation.scenario.b15_loc_hors_hlm ? 'Locataire hors HLM' : simulation.scenario.b15_proprietaire ? 'Propriétaire' : '',
        simulation.scenario.b15_taux_reallocation,
      ].join(DELIMITER)

      csvRows.push(row)
    }

    return {
      simulation,
      csvData: csvRows.join('\n'),
    }
  }

  /**
   * Gets the list of simulations for a user and groups them by their most common bassinName.
   */
  async getDashboardList(userId: string) {
    const simulations = await this.list(userId)

    // Group simulations by their most common bassinName
    const groupedSimulations: Record<string, TSimulationWithEpci[]> = {}

    simulations.forEach((simulation) => {
      const bassinNames = simulation.epcis.map(({ bassinName }) => bassinName).filter((name): name is string => Boolean(name))

      // Count occurrences
      const counts = new Map<string, number>()
      bassinNames.forEach((name) => {
        counts.set(name, (counts.get(name) || 0) + 1)
      })

      // Find the name with the highest count
      let mostCommon = 'Autres'
      let maxCount = 0

      counts.forEach((count, name) => {
        if (count > maxCount) {
          maxCount = count
          mostCommon = name
        }
      })
      groupedSimulations[mostCommon] = groupedSimulations[mostCommon] || []
      groupedSimulations[mostCommon].push(simulation)
    })

    return groupedSimulations
  }
}
