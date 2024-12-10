import { Injectable } from '@nestjs/common'
import { TCreateScenario } from '~/schemas/scenarios/create-scenario'
import { TScenario, ZScenario } from '~/schemas/scenarios/scenario'
import { PrismaService } from '../db/prisma.service'

@Injectable()
export class ScenariosService {
  constructor(private readonly prisma: PrismaService) {}

  async hasUserAccessTo(id: string, userId: string): Promise<boolean> {
    return !!(await this.prisma.scenario.findFirst({
      where: { id, userId },
    }))
  }

  async get(userId: string, id: string): Promise<TScenario> {
    const scenario = await this.prisma.scenario.findUniqueOrThrow({
      where: { id, userId },
    })

    return ZScenario.parse(scenario)
  }

  async list(userId: string) {
    return this.prisma.scenario.findMany({ where: { userId } })
  }

  async create(userId: string, data: TCreateScenario) {
    return this.prisma.scenario.create({
      data: {
        ...data,
        user: { connect: { id: userId } },
      },
    })
  }

  async update(userId: string, id: string, data: Partial<TScenario>) {
    return this.prisma.scenario.update({
      data: {
        ...data,
      },
      where: { id, userId },
    })
  }

  async delete(userId: string, id: string) {
    return this.prisma.scenario.delete({ where: { id, userId } })
  }
}
