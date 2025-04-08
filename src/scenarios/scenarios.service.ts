import { Injectable } from '@nestjs/common'
import { TInitScenario, TUpdateSimulationDto } from '~/schemas/scenarios/scenario'
import { PrismaService } from '../db/prisma.service'

@Injectable()
export class ScenariosService {
  constructor(private readonly prisma: PrismaService) {}

  async hasUserAccessTo(id: string, userId: string): Promise<boolean> {
    return !!(await this.prisma.scenario.findFirst({
      where: { id, userId },
    }))
  }

  async get(id: string) {
    return this.prisma.scenario.findUniqueOrThrow({
      where: { id },
    })
  }

  async list(userId: string) {
    return this.prisma.scenario.findMany({ where: { userId } })
  }

  async create(userId: string, data: TInitScenario) {
    const { epcis, ...scenario } = data
    return this.prisma.scenario.create({
      data: {
        ...scenario,
        epciScenarios: {
          createMany: {
            data: Object.entries(epcis).map(([code, epciScenario]) => ({
              epciCode: code,
              ...epciScenario,
            })),
          },
        },
        user: { connect: { id: userId } },
      },
    })
  }

  async update(id: string, data: TUpdateSimulationDto) {
    const { epciScenarios, ...scenario } = data
    return this.prisma.scenario.update({
      data: {
        ...scenario,
        ...(epciScenarios
          ? {
              epciScenarios: {
                updateMany: Object.entries(epciScenarios).map(([epciCode, epciScenario]) => ({
                  where: {
                    scenarioId: id,
                    epciCode,
                  },
                  data: {
                    b2_tx_restructuration: epciScenario.b2_tx_restructuration,
                    b2_tx_disparition: epciScenario.b2_tx_disparition,
                    b2_tx_vacance: epciScenario.b2_tx_vacance,
                    b2_tx_rs: epciScenario.b2_tx_rs,
                    default: epciScenario.default,
                  },
                })),
              },
            }
          : {}),
      },
      where: { id },
    })
  }

  async delete(userId: string, id: string) {
    return this.prisma.scenario.delete({ where: { id, userId } })
  }
}
