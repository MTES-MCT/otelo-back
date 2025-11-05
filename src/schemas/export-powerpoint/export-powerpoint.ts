import { z } from 'zod'

export const ZLayout = z.object({
  layoutEpciName: z.string(),
  layoutBassinName: z.string(),
  layoutStart: z.string(),
  layoutEnd: z.string(),
  layoutDocumentType: z.string(),
})
export type TLayout = z.infer<typeof ZLayout>

export const ZChartPlaceholder = z.array(
  z.object({
    data: z.unknown(),
    templateImageFileName: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  }),
)

export const ZPowerpointPlaceholders = z.object({
  slide1: z.object({
    text: z.object({
      selectedEpciName: z.string(),
      documentType: z.string(),
      period: z.string(),
      date: z.string(),
    }),
  }),
  slide2: z.object({
    text: z.object({
      privilegedScenario: z.string(),
      nb: z.string(),
    }),
  }),
  slide4: z.object({
    text: ZLayout.extend({
      start: z.string(),
      end: z.string(),
      nbSupp: z.string(),
      nbNew: z.string(),
      nb: z.string(),
      percentMenages: z.string(),
      nbMenages: z.string(),
      percentBadHousing: z.string(),
      percentFluidity: z.string(),
      nbResorption: z.string(),
      peakYear: z.string(),
      privilegedScenario: z.string(),
      orgName: z.string(),
    }),
  }),
  slide6: z.object({
    text: ZLayout,
  }),
  slide8: z.object({
    text: ZLayout,
    charts: ZChartPlaceholder,
  }),
  slide9: z.object({
    text: ZLayout,
  }),
  slide10: z.object({
    text: ZLayout.extend({
      pb1: z.string(),
      pb2: z.string(),
      pb3: z.string(),
      pc1: z.string(),
      pc2: z.string(),
      pc3: z.string(),
      ph1: z.string(),
      ph2: z.string(),
      ph3: z.string(),
    }),
    charts: ZChartPlaceholder,
  }),
  slide11: z.object({
    text: ZLayout.extend({
      pcA1: z.string(),
      pcA2: z.string(),
      pcA3: z.string(),
      pcT1: z.string(),
      pcT2: z.string(),
      pcT3: z.string(),
      pcD1: z.string(),
      pcD2: z.string(),
      pcD3: z.string(),
      phT1: z.string(),
      phT2: z.string(),
      phT3: z.string(),
      pbT1: z.string(),
      pbT2: z.string(),
      pbT3: z.string(),
    }),
    charts: ZChartPlaceholder,
  }),
  slide12: z.object({
    text: ZLayout,
    charts: ZChartPlaceholder,
  }),
  slide13: z.object({
    text: z.object({
      nb: z.string(),
    }),
  }),
  slide14: z.object({
    text: ZLayout.extend({
      horizon: z.string(),
      scenarioName: z.string(),
      privilegedScenario: z.string(),
      tendanciel: z.string(),
      acceleration: z.string(),
      default: z.string(),
      prin1: z.string(),
      prin2: z.string(),
      prin3: z.string(),
      menageHorizon1: z.string(),
      menageHorizon2: z.string(),
      menageHorizon3: z.string(),
      vacance1: z.string(),
      vacance2: z.string(),
      rs1: z.string(),
      rs2: z.string(),
      resorb1: z.string(),
      resorb2: z.string(),
      resorb3: z.string(),
    }),
  }),
  slide15: z.object({
    text: ZLayout.extend({
      start: z.string(),
      end: z.string(),
      newHousing1: z.string(),
      newHousing2: z.string(),
      newHousing3: z.string(),
      demographic1: z.string(),
      demographic2: z.string(),
      demographic3: z.string(),
      fluidity1: z.string(),
      fluidity2: z.string(),
      fluidity3: z.string(),
      badHousing1: z.string(),
      badHousing2: z.string(),
      badHousing3: z.string(),
      secondary1: z.string(),
      secondary2: z.string(),
      secondary3: z.string(),
      housingNeeds1: z.string(),
      housingNeeds2: z.string(),
      housingNeeds3: z.string(),
      vacant1: z.string(),
      vacant2: z.string(),
      vacant3: z.string(),
      total1: z.string(),
      total2: z.string(),
      total3: z.string(),
    }),
  }),
  slide16: z.object({
    text: ZLayout.extend({ start: z.string(), end: z.string() }),
  }),
  slide17: z.object({
    text: ZLayout,
  }),
  slide18: z.object({
    text: ZLayout.extend({
      privilegedScenario: z.string(),
    }),
  }),
  slide19: z.object({
    text: ZLayout.extend({
      'docStart-1': z.string(),
      docStart: z.string(),
      docEnd: z.string(),
      'docEnd+1': z.string(),
      projection: z.string(),
      nb1: z.string(),
      nb2: z.string(),
      nb3: z.string(),
    }),
  }),
  slide20: z.object({
    text: ZLayout,
    charts: ZChartPlaceholder,
  }),
  slide21: z.object({
    text: ZLayout.extend({
      nbNv: z.string(),
      nbFluid: z.string(),
      nbRs: z.string(),
      nbUrb: z.string(),
      nbVac: z.string(),
      nb: z.string(),
      projection: z.string(),
      total: z.string(),
      dperc: z.string(),
    }),
  }),
  slide22: z.object({
    text: ZLayout.extend({
      nbHosted: z.string(),
      nbNoAccommodation: z.string(),
      nbBadQuality: z.string(),
      nbFinancialInadequation: z.string(),
      nbPhysicalInadequation: z.string(),
      percentHosted: z.string(),
      percentNoAcc: z.string(),
      percentBadQ: z.string(),
      percentFI: z.string(),
      percentPI: z.string(),
      resorbYear: z.string(),
    }),
  }),
  slide23: z.object({
    text: ZLayout,
    charts: ZChartPlaceholder,
  }),
  slide24: z.object({
    text: ZLayout,
  }),
  slide25: z.object({
    text: ZLayout,
  }),
  slide26: z.object({
    text: ZLayout,
  }),
  slide27: z.object({
    text: ZLayout,
  }),
  slide28: z.object({
    text: ZLayout,
  }),
  slide30: z.object({
    text: ZLayout,
  }),
})

export type TPowerpointPlaceholders = z.infer<typeof ZPowerpointPlaceholders>
