import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import { ScenariosService } from '~/scenarios/scenarios.service'
import { TEpci } from '~/schemas/epcis/epci'
import { TScenario } from '~/schemas/scenarios/scenario'
import { SimulationsService } from './simulations.service'

describe('SimulationsService', () => {
  let service: SimulationsService
  const mockPrismaService = createMock<PrismaService>()

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimulationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ScenariosService,
          useValue: createMock<ScenariosService>(),
        },
      ],
    }).compile()

    service = module.get<SimulationsService>(SimulationsService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('hasUserAccessTo', () => {
    it('should return true when a simulation is found', async () => {
      mockPrismaService.simulation.findFirst = jest.fn().mockResolvedValue({ id: 'simulation-1' })
    })

    it('should return false when no simulation is found', async () => {
      mockPrismaService.simulation.findFirst = jest.fn().mockResolvedValue(null)
      const result = await service.hasUserAccessTo('user-1', 'simulation-1')
      expect(result).toBe(false)
    })
  })

  describe('list', () => {
    it('should return all simulations for a user', async () => {
      mockPrismaService.simulation.findMany = jest.fn().mockResolvedValue([])
      const result = await service.list('user-1')
      expect(result).toEqual([])
    })
  })

  describe('get', () => {
    it('should return a simulation for a user', async () => {
      mockPrismaService.simulation.findUniqueOrThrow = jest.fn().mockResolvedValue({ id: 'simulation-1' })
      const result = await service.get('simulation-1')
      expect(result).toEqual({ id: 'simulation-1' })
    })
  })

  describe('create', () => {
    it('should create a simulation', async () => {
      mockPrismaService.simulation.create = jest.fn().mockResolvedValue({ id: 'simulation-1' })
      const result = await service.create('user-1', {
        datasourceId: 'datasource-1',
        epci: {} as TEpci,
        epciCode: 'epci-1',
        name: 'Simulation 1',
        scenario: {} as TScenario,
        scenarioId: 'scenario-1',
        userId: 'user-1',
      })
      expect(result).toEqual({ id: 'simulation-1' })
    })
  })

  describe('update', () => {
    it('should update a simulation', async () => {
      mockPrismaService.simulation.update = jest.fn().mockResolvedValue({ id: 'simulation-1' })
      const result = await service.update('user-1', 'simulation-1', {
        name: 'Simulation 1',
      })
      expect(result).toEqual({ id: 'simulation-1' })
    })

    it('should throw an error when the simulation does not exist', async () => {
      mockPrismaService.simulation.update = jest.fn().mockRejectedValue(new Error('Simulation not found'))
      await expect(service.update('user-1', 'simulation-1', { name: 'Simulation 1' })).rejects.toThrow('Simulation not found')
    })
  })

  describe('delete', () => {
    it('should delete a simulation', async () => {
      mockPrismaService.simulation.delete = jest.fn().mockResolvedValue({ id: 'simulation-1' })
      const result = await service.delete('user-1', 'simulation-1')
      expect(result).toEqual({ id: 'simulation-1' })
    })
  })
})
