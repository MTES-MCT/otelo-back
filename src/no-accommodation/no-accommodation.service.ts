import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'
import { TEpci } from '~/schemas/epcis/epci'

@Injectable()
export class NoAccommodationService {
  constructor(private readonly prismaService: PrismaService) {}

  async getNoAccommodationByEpci(epciCode: string) {
    const [homeless, hotel, makeShiftHousingRp] = await Promise.all([
      this.prismaService.homeless.findFirstOrThrow({
        where: { epciCode },
      }),
      this.prismaService.hotel.findFirstOrThrow({
        where: { epciCode },
      }),
      this.prismaService.makeShiftHousing_RP.findFirstOrThrow({
        where: { epciCode },
      }),
      this.prismaService.makeShiftHousing_SNE.findFirstOrThrow({
        where: { epciCode },
      }),
    ])
    const homelessRes = homeless.rp
    const hotelRes = hotel.rp
    return {
      homeless: homelessRes,
      hotel: hotelRes,
      makeShiftHousing: makeShiftHousingRp.value,
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
