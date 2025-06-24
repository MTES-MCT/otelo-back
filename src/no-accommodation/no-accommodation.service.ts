import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'
import { TEpci } from '~/schemas/epcis/epci'

@Injectable()
export class NoAccommodationService {
  constructor(private readonly prismaService: PrismaService) {}

  async getNoAccommodationByEpci(epciCode: string) {
    const [homeless, hotel, makeShiftHousingRp] = await Promise.all([
      this.prismaService.homeless.findFirst({
        where: { epciCode },
      }),
      this.prismaService.hotel.findFirst({
        where: { epciCode },
      }),
      this.prismaService.makeShiftHousing_RP.findFirst({
        where: { epciCode },
      }),
    ])
    const homelessRes = homeless?.rp ?? 0
    const hotelRes = hotel?.rp ?? 0
    return {
      homeless: homelessRes,
      hotel: hotelRes,
      makeShiftHousing: makeShiftHousingRp?.value ?? 0,
    }
  }
  async getNoAccommodation(epcis: TEpci[]) {
    const results = await Promise.all(
      epcis.map(async (epci) => ({
        ...(await this.getNoAccommodationByEpci(epci.code)),
        epci,
      })),
    )

    return { noAccommodation: results }
  }
}
