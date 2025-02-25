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
    return this.prisma.scenario.update({
      data,
      where: { id },
    })
  }

  async delete(userId: string, id: string) {
    return this.prisma.scenario.delete({ where: { id, userId } })
  }
}
