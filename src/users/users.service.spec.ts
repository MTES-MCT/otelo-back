import { createMock } from '@golevelup/ts-jest'
import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import { TUser } from '~/schemas/users/user'
import { UsersService } from './users.service'

describe('UsersService', () => {
  let service: UsersService
  let prismaService: jest.Mocked<PrismaService>

  const mockPrismaService = createMock<PrismaService>()

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile()

    service = module.get<UsersService>(UsersService)
    prismaService = module.get(PrismaService) as jest.Mocked<PrismaService>
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('hasUserAccessTo', () => {
    it('should return true when a user is found', async () => {
      prismaService.user.findFirst = jest.fn().mockResolvedValue({ id: 'user-1' })
    })

    it('should return false when no user is found', async () => {
      prismaService.user.findFirst = jest.fn().mockResolvedValue(null)
      const result = await service.hasUserAccessTo('user-1')
      expect(result).toBe(false)
    })
  })

  describe('getByToken', () => {
    it('should return a user when a valid token is provided', async () => {
      const mockUser: TUser = {
        createdAt: new Date('2024-01-01'),
        email: 'test@example.com',
        firstname: 'firstname',
        id: 'user-1',
        lastLoginAt: new Date('2024-01-01'),
        lastname: 'lastname',
        provider: 'provider',
        role: 'USER',
        sub: 'user-1',
        updatedAt: new Date('2024-01-01'),
      }

      prismaService.user.findFirstOrThrow = jest.fn().mockResolvedValue(mockUser)

      const result = await service.getByToken('valid-token')
      expect(result).toEqual(mockUser)
      expect(prismaService.user.findFirstOrThrow).toHaveBeenCalledWith({
        where: {
          sessions: { some: { accessToken: 'valid-token' } },
        },
      })
    })

    it('should throw NotFoundException when user is not found', async () => {
      prismaService.user.findFirstOrThrow = jest.fn().mockRejectedValue(new NotFoundException('User not found'))

      await expect(service.getByToken('invalid-token')).rejects.toThrow(NotFoundException)
      expect(prismaService.user.findFirstOrThrow).toHaveBeenCalledWith({
        where: {
          sessions: { some: { accessToken: 'invalid-token' } },
        },
      })
    })
  })

  describe('findByEmail', () => {
    it('should return a user when a valid email is provided', async () => {
      const mockUser: TUser = {
        createdAt: new Date('2024-01-01'),
        email: 'test@example.com',
        firstname: 'firstname',
        id: 'user-1',
        lastLoginAt: new Date('2024-01-01'),
        lastname: 'lastname',
        provider: 'provider',
        role: 'USER',
        sub: 'user-1',
        updatedAt: new Date('2024-01-01'),
      }
      prismaService.user.findUnique = jest.fn().mockResolvedValue(mockUser)
      const result = await service.findByEmail('test@example.com')
      expect(result).toEqual(mockUser)
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      })
    })

    it('should return null when no user is found', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue(null)
      const result = await service.findByEmail('nonexistent@example.com')
      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create a user', async () => {
      const mockUser: TUser = {
        createdAt: new Date('2024-01-01'),
        email: 'test@example.com',
        firstname: 'firstname',
        id: 'user-1',
        lastLoginAt: new Date('2024-01-01'),
        lastname: 'lastname',
        provider: 'provider',
        role: 'USER',
        sub: 'user-1',
        updatedAt: new Date('2024-01-01'),
      }
      prismaService.user.create = jest.fn().mockResolvedValue(mockUser)
      const result = await service.create(mockUser)
      expect(result).toEqual(mockUser)
    })
  })
})
