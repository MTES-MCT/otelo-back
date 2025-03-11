import { Injectable } from '@nestjs/common'
import { VacancyAccommodation } from '@prisma/client'
import { PrismaService } from '~/db/prisma.service'
import { EpcisService } from '~/epcis/epcis.service'

@Injectable()
export class VacancyService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly epcisService: EpcisService,
  ) {}

  async getVacancy(epcisCodes: string[]): Promise<VacancyAccommodation[]> {
    return this.prismaService.vacancyAccommodation.findMany({
      where: { epciCode: { in: epcisCodes }, year: { equals: 2024 } },
    })
  }
}
