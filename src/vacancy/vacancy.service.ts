import { Injectable } from '@nestjs/common'
import { VacancyAccommodation } from '@prisma/client'
import { PrismaService } from '~/db/prisma.service'

@Injectable()
export class VacancyService {
  constructor(private readonly prismaService: PrismaService) {}

  async getVacancy(epciCode: string): Promise<VacancyAccommodation> {
    return this.prismaService.vacancyAccommodation.findFirstOrThrow({
      where: { epciCode },
    })
  }
}
