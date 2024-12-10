import { Injectable } from '@nestjs/common'
import { Simulation } from '@prisma/client'
import { PrismaService } from '~/db/prisma.service'
import { ScenariosService } from '~/scenarios/scenarios.service'
import { TInitSimulation } from '~/schemas/simulations/create-simulation'
import { TSimulation, TSimulationWithEpci, TSimulationWithEpciAndScenario } from '~/schemas/simulations/simulation'

@Injectable()
export class SimulationsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly scenariosService: ScenariosService,
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
        epci: { select: { code: true, name: true, region: true } },
        id: true,
        updatedAt: true,
      },
      where: { userId },
    })

    return simulations.map((simulation) => ({
      createdAt: simulation.createdAt,
      epci: simulation.epci,
      id: simulation.id,
      updatedAt: simulation.updatedAt,
    }))
  }

  async get(id: string): Promise<TSimulationWithEpciAndScenario> {
    const simulation = await this.prismaService.simulation.findUniqueOrThrow({
      include: { epci: true, scenario: true },
      where: { id },
    })

    return {
      createdAt: simulation.createdAt,
      epci: simulation.epci,
      id: simulation.id,
      //todo - remove cast (null value from db)
      scenario: simulation.scenario as any,

      updatedAt: simulation.updatedAt,
    }
  }

  async create(userId: string, data: TInitSimulation): Promise<Simulation> {
    const scenario = await this.scenariosService.create(userId, data.scenario)

    return this.prismaService.simulation.create({
      data: {
        epci: {
          connectOrCreate: {
            create: data.epci,
            where: { code: data.epci.code },
          },
        },
        name: 'Simulation',
        scenario: { connect: { id: scenario.id } },
        user: { connect: { id: userId } },
      },
    })
  }

  async update(userId: string, id: string, data: Partial<TSimulation>): Promise<Simulation> {
    return this.prismaService.simulation.update({
      data,
      where: { id, userId },
    })
  }

  async delete(userId: string, id: string): Promise<Simulation> {
    return this.prismaService.simulation.delete({
      where: { id, userId },
    })
  }
}
