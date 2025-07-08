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
    const scenario = await this.prisma.scenario.findUniqueOrThrow({
      include: {
        epciScenarios: true,
      },
      where: { id },
    })

    const sortedEpciScenarios = scenario.epciScenarios.sort((a, b) => {
      if (a.baseEpci === b.baseEpci) return 0
      return a.baseEpci ? -1 : 1
    })

    return {
      ...scenario,
      epciScenarios: sortedEpciScenarios,
    }
  }

  async list(userId: string) {
    return this.prisma.scenario.findMany({ where: { userId } })
  }

  async create(userId: string, data: TInitScenario) {
    const { epcis, ...scenario } = data

    const epciCodes = Object.keys(epcis)
    const filocomFluxData = await this.prisma.filocomFlux.findMany({
      where: {
        epciCode: { in: epciCodes },
      },
    })

    const filocomFluxMap = new Map(filocomFluxData.map((flux) => [flux.epciCode, flux]))
    const epciScenariosData = Object.entries(epcis).map(([code, epciScenario]) => {
      const filocomFlux = filocomFluxMap.get(code)
      if (!filocomFlux) {
        throw new Error(`FilocomFlux not found for EPCI code: ${code}`)
      }

      return {
        epciCode: code,
        ...epciScenario,
        b2_tx_restructuration: filocomFlux.txRestParctot / 6,
        b2_tx_disparition: filocomFlux.txDispParctot / 6,
      }
    })

    return this.prisma.scenario.create({
      data: {
        ...scenario,
        epciScenarios: {
          createMany: {
            data: epciScenariosData,
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
                updateMany: Object.entries(epciScenarios).map(
                  ([
                    epciCode,
                    { b2_tx_disparition, b2_tx_restructuration, b2_tx_rs, b2_tx_vacance, b2_tx_vacance_longue, b2_tx_vacance_courte },
                  ]) => ({
                    where: {
                      scenarioId: id,
                      epciCode,
                    },
                    data: {
                      b2_tx_restructuration,
                      b2_tx_disparition,
                      b2_tx_vacance,
                      b2_tx_vacance_longue,
                      b2_tx_vacance_courte,
                      b2_tx_rs,
                    },
                  }),
                ),
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
