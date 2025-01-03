import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'
import { VacancyService } from '~/vacancy/vacancy.service'

@Injectable()
export class AccommodationRatesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly vacancyService: VacancyService,
  ) {}

  async getAccommodationRates(epciCode: string) {
    const data = await this.prismaService.filocomFlux.findFirstOrThrow({
      where: {
        epciCode,
      },
    })
    const vacancy = await this.vacancyService.getVacancy(epciCode)

    return {
      txLv: data.txLvParctot,
      txRs: data.txRsParctot,
      vacancy: {
        nbAccommodation: vacancy.nbLocVacPPLong,
        txLvLongue: vacancy.propLocVacPPLong,
      },
    }
  }
}
