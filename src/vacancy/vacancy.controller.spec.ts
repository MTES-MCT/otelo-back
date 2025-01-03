import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { VacancyService } from '~/vacancy/vacancy.service'
import { VacancyController } from './vacancy.controller'

describe('VacancyController', () => {
  let controller: VacancyController
  const mockVacancyService = createMock<VacancyService>()

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VacancyController],
      providers: [
        {
          provide: VacancyService,
          useValue: mockVacancyService,
        },
      ],
    }).compile()

    controller = module.get<VacancyController>(VacancyController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
