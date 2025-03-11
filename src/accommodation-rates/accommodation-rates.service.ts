import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'
import { EpcisService } from '~/epcis/epcis.service'
import { VacancyService } from '~/vacancy/vacancy.service'

interface AccommodationRatesByEpci {
  [epciCode: string]: {
    txLv: number
    txRs: number
    vacancy: {
      nbAccommodation: number
      txLvLongue: number
      txLvLongue2Years: number
      txLvLongue5Years: number
      year?: number
    }
  }
}

@Injectable()
export class AccommodationRatesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly vacancyService: VacancyService,
    private readonly epcisService: EpcisService,
  ) {}

  async getAccommodationRates(epciCode: string): Promise<AccommodationRatesByEpci> {
    const epcis = await this.epcisService.getBassinEpcisByEpciCode(epciCode)
    const epcisCodes = epcis.map((epci) => epci.code)

    const [filocomData, vacancyData] = await Promise.all([
      this.prismaService.filocomFlux.findMany({
        where: {
          epciCode: { in: epcisCodes },
        },
      }),
      this.vacancyService.getVacancy(epcisCodes),
    ])

    return epcisCodes.reduce<AccommodationRatesByEpci>((acc, epciCode) => {
      const epciVacancy = vacancyData.find((v) => v.epciCode === epciCode)
      const epciFilocom = filocomData.find((f) => f.epciCode === epciCode)
      acc[epciCode] = {
        txLv: epciFilocom?.txLvParctot ?? 0,
        txRs: epciFilocom?.txRsParctot ?? 0,
        vacancy: {
          nbAccommodation: (epciVacancy?.nbLogVac2More ?? 0) + (epciVacancy?.nbLogVac5More ?? 0),
          txLvLongue: ((epciVacancy?.propLogVac2More ?? 0) + (epciVacancy?.propLogVac5More ?? 0)) * 100,
          txLvLongue2Years: (epciVacancy?.propLogVac2More ?? 0) * 100,
          txLvLongue5Years: (epciVacancy?.propLogVac5More ?? 0) * 100,
          year: epciVacancy?.year,
        },
      }

      return acc
    }, {})
  }
}
