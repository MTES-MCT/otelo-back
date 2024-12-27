import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import { AccommodationRatesService } from './accommodation-rates.service'

describe('AccommodationRatesService', () => {
  let service: AccommodationRatesService
  const mockPrismaService = createMock<PrismaService>()

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccommodationRatesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile()

    service = module.get<AccommodationRatesService>(AccommodationRatesService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
