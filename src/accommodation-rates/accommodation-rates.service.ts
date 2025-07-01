import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'
import { VacancyService } from '~/vacancy/vacancy.service'

interface AccommodationRatesByEpci {
  [epciCode: string]: {
    txLv: number
    txLvLD: number
    txLvCD: number
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
  ) {}

  async getAccommodationRates(epcis: string): Promise<AccommodationRatesByEpci> {
    const epcisCodes = epcis.split(',')

    const [filocomData, vacancyData] = await Promise.all([
      this.prismaService.filocomFlux.findMany({
        where: {
          epciCode: { in: epcisCodes },
        },
      }),
      this.vacancyService.getNewestVacancy(epcisCodes),
    ])

    return epcisCodes.reduce<AccommodationRatesByEpci>((acc, epciCode) => {
      const epciVacancy = vacancyData.find((v) => v.epciCode === epciCode)
      const epciFilocom = filocomData.find((f) => f.epciCode === epciCode)
      const ratioLongGlobalTerm = epciVacancy!.nbLogVac2More / epciVacancy!.nbLogVac2Less
      const ratioShortGlobalTerm = (epciVacancy!.nbLogVac2Less - epciVacancy!.nbLogVac2More) / epciVacancy!.nbLogVac2Less
      const txLvLD = (epciFilocom?.txLvParctot ?? 0) * ratioLongGlobalTerm
      const txLvCD = (epciFilocom?.txLvParctot ?? 0) * ratioShortGlobalTerm
      acc[epciCode] = {
        txLv: txLvLD + txLvCD,
        txLvLD,
        txLvCD,
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
