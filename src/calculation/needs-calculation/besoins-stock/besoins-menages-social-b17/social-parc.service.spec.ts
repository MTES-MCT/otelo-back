import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { SocialParcService } from '~/calculation/needs-calculation/besoins-stock/besoins-menages-social-b17/social-parc.service'
import { PrismaService } from '~/db/prisma.service'

describe('SocialParcService', () => {
  let service: SocialParcService
  let mockContext: CalculationContext

  beforeEach(async () => {
    mockContext = {
      simulation: {
        scenario: {
          b17_motif: 'Tout',
          coefficient: 1,
        },
      },
    } as unknown as CalculationContext

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocialParcService,
        {
          provide: 'CalculationContext',
          useValue: mockContext,
        },
        {
          provide: PrismaService,
          useValue: createMock<PrismaService>(),
        },
      ],
    }).compile()

    service = module.get<SocialParcService>(SocialParcService)

    // biome-ignore lint: TODO
    jest.spyOn(service as any, 'applyCoefficient').mockImplementation((value) => value)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  //   describe('calculate', () => {
  //     it('should calculate correctly for "Tout" motif', () => {
  //       mockContext.simulation.scenario.b17_motif = 'Tout';
  //       const result = service.calculate(mockData);
  //       expect(result).toBe(100); // crea value
  //     });

  //     it('should calculate correctly for "Env" motif', () => {
  //       mockContext.simulation.scenario.b17_motif = 'Env';
  //       const result = service.calculate(mockData);
  //       expect(result).toBe(200); // crea_voisin value
  //     });

  //     it('should calculate correctly for "Assis" motif', () => {
  //       mockContext.simulation.scenario.b17_motif = 'Assis';
  //       const result = service.calculate(mockData);
  //       expect(result).toBe(300); // crea_mater value
  //     });

  //     it('should calculate correctly for "Rappr" motif', () => {
  //       mockContext.simulation.scenario.b17_motif = 'Rappr';
  //       const result = service.calculate(mockData);
  //       expect(result).toBe(400); // crea_services value
  //     });

  //     it('should calculate correctly for "Trois" motif', () => {
  //       mockContext.simulation.scenario.b17_motif = 'Trois';
  //       const result = service.calculate(mockData);
  //       expect(result).toBe(500); // crea_motifs value
  //     });

  //     it('should apply coefficient correctly', () => {
  //       mockContext.coefficient = 2;
  //       mockContext.simulation.scenario.b17_motif = 'Tout';
  //       const result = service.calculate(mockData);
  //       expect(result).toBe(100);
  //     });

  //     it('should handle zero values', () => {
  //       mockData.b17.parc_social.sne.crea = 0;
  //       mockContext.simulation.scenario.b17_motif = 'Tout';
  //       const result = service.calculate(mockData);
  //       expect(result).toBe(0);
  //     });
  //   });
})
