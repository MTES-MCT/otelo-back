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
    const { simulation } = this.context
    const { epci, scenario } = simulation
    const { code: epciCode } = epci

    const sourceCalculators = {
      FF: async () => {
        const getColumnPrefix = () => {
          const qualityMap = {
            FF_Ind: 'ppSs',
            FF_ss_ent: 'ppSsEnt',
            FF_ss_ent_mvq: 'ppSsQualiEnt',
          }

          const comfortMap = {
            FF_abs_chauf: 'Chauff',
            FF_abs_sani: 'Sdb',
            FF_abs_sani_chauf: 'SdbChauff',
            FF_abs_wc: 'Wc',
            FF_abs_wc_chauf: 'WcChauff',
            FF_abs_wc_sani: 'WcSdb',
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
          const locColumn = `${columnPrefix}Loc`
          sum += (foncierData[locColumn] as number) || 0
        }
        if (scenario.b14_occupation.includes('prop')) {
          const pptColumn = `${columnPrefix}Ppt`
          sum += (foncierData[pptColumn] as number) || 0
        }
        return sum
      },
      Filo: async () => {
        let sum = 0
        let type: string = ''
        if (scenario.b14_occupation.includes('loc')) {
          type = 'pppiLp'
        }
        if (scenario.b14_occupation.includes('prop')) {
          type = 'pppiPo'
        }
        sum += (await this.getFilocomBadQuality(epciCode))[type]
        return sum
      },
      RP: async () => {
        const badQuality = await this.getRPBadQuality(epciCode)
        const comfortMap = {
          RP_abs_sani: {
            loc: badQuality.saniLocNonhlm,
            prop: badQuality.saniPpT,
          },
          RP_abs_sani_chfl: {
            loc: badQuality.saniChflLocNonhlm,
            prop: badQuality.saniChflPpT,
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
    return this.applyCoefficient(result * (1 - scenario.b14_taux_reallocation / 100.0))
  }
}
