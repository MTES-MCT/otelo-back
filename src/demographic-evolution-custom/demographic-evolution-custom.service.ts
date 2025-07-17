import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'
import { TCreateDemographicEvolutionCustomDto } from '~/schemas/scenarios/demographic-evolution-custom'

@Injectable()
export class DemographicEvolutionCustomService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, data: TCreateDemographicEvolutionCustomDto) {
    return this.prisma.demographicEvolutionOmphaleCustom.create({
      data: {
        data: data.data,
        userId,
        epciCode: data.epciCode,
      },
    })
  }

  async hasUserAccessTo(id: string, userId: string): Promise<boolean> {
    return !!(await this.prisma.demographicEvolutionOmphaleCustom.findFirst({
      where: { id, userId },
    }))
  }

  async findOne(id: string) {
    return this.prisma.demographicEvolutionOmphaleCustom.findUniqueOrThrow({
      where: { id },
    })
  }

  async findByUser(userId: string) {
    return this.prisma.demographicEvolutionOmphaleCustom.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async delete(id: string, userId: string) {
    return this.prisma.demographicEvolutionOmphaleCustom.delete({
      where: { id, userId },
    })
  }
}
