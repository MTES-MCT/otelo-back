import { Inject, Injectable } from '@nestjs/common'
import { BaseCalculator, CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { PrismaService } from '~/db/prisma.service'

@Injectable()
export class BadQualityService extends BaseCalculator {
  constructor(
    @Inject('CalculationContext')
    protected readonly context: CalculationContext,
    private readonly prismaService: PrismaService,
  ) {
    super(context)
  }

  async getRPBadQuality(epciCode: string) {
    return this.prismaService.badQuality_RP.findUniqueOrThrow({
      where: { epciCode },
    })
  }

  async getFilocomBadQuality(epciCode: string) {
    return this.prismaService.badQuality_Filocom.findUniqueOrThrow({
      where: { epciCode },
    })
  }
  async getFFBadQuality(epciCode: string) {
    return this.prismaService.badQuality_Fonciers.findUniqueOrThrow({
      where: { epciCode },
    })
  }

  async calculate(): Promise<number> {
    const { coefficient, simulation } = this.context
    const { epci, scenario } = simulation
    const { code: epciCode } = epci

    const sourceCalculators = {
      FF: async () => {
        const getColumnPrefix = () => {
          const qualityMap = {
            FF_Ind: 'pp_ss_',
            FF_ss_ent: 'pp_ss_ent_',
            FF_ss_ent_mvq: 'pp_ss_quali_ent_',
          }

          const comfortMap = {
            FF_abs_chauf: 'chauff',
            FF_abs_sani: 'sdb',
            FF_abs_sani_chauf: 'sdb_chauff',
            FF_abs_wc: 'wc',
            FF_abs_wc_chauf: 'wc_chauff',
            FF_abs_wc_sani: 'wc_sdb',
            FF_abs_wc_sani_chauf: '3elts',
          }

          const prefix = qualityMap[scenario.b14_qualite]
          const comfort = comfortMap[scenario.b14_confort]
          return `${prefix}${comfort}`
        }

        const foncierData = await this.getFFBadQuality(epciCode)
        const columnPrefix = getColumnPrefix()

        let sum = 0
        if (scenario.b14_occupation.includes('loc')) {
          const locColumn = `${columnPrefix}_loc` as keyof typeof foncierData
          sum += (foncierData[locColumn] as number) || 0
        }
        if (scenario.b14_occupation.includes('prop')) {
          const pptColumn = `${columnPrefix}_ppt` as keyof typeof foncierData
          sum += (foncierData[pptColumn] as number) || 0
        }
        return sum
      },
      Filo: async () => {
        let sum = 0
        let type: string = ''
        if (scenario.b14_occupation.includes('loc')) {
          type = 'pppi_lp'
        }
        if (scenario.b14_occupation.includes('prop')) {
          type = 'pppi_po'
        }
        sum += (await this.getFilocomBadQuality(epciCode))[type]
        return sum
      },
      RP: async () => {
        const comfortMap = {
          RP_abs_sani: {
            loc: (await this.getRPBadQuality('epciCode')).saniLocNonhlm,
            prop: (await this.getRPBadQuality('epciCode')).saniPpT,
          },
          RP_abs_sani_chfl: {
            loc: (await this.getRPBadQuality('epciCode')).saniChflLocNonhlm,
            prop: (await this.getRPBadQuality('epciCode')).saniChflPpT,
          },
        }

        let sum = 0
        if (scenario.b14_occupation.includes('loc')) {
          sum += comfortMap[scenario.b14_confort]?.loc || 0
        }
        if (scenario.b14_occupation.includes('prop')) {
          sum += comfortMap[scenario.b14_confort]?.prop || 0
        }
        return sum
      },
    }

    const result = (await sourceCalculators[scenario.source_b14]?.()) || 0
    return Math.round(result * (1 - scenario.b14_taux_reallocation / 100.0) * coefficient)
  }
}
