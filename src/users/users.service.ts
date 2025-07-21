import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'
import { TCreateUser } from '~/schemas/users/create-user'
import { TUser, TUserList } from '~/schemas/users/user'

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async hasUserAccessTo(email: string): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: { email },
    })
    return !!user && (user.role === 'ADMIN' || user.hasAccess)
  }

  async list(): Promise<{ userCount: number; users: TUser[] }> {
    const users = await this.prisma.user.findMany()
    const userCount = await this.prisma.user.count()

    return {
      userCount,
      users,
    }
  }

  async updateAccess(id: string, hasAccess: boolean): Promise<TUser> {
    if (!hasAccess) {
      await this.prisma.session.deleteMany({ where: { userId: id } })
    }
    return this.prisma.user.update({
      data: { hasAccess },
      where: { id },
    })
  }

  async search(query: string): Promise<{ userCount: number; users: TUserList[] }> {
    const foundUsers = await this.prisma.user.findMany({
      select: {
        createdAt: true,
        email: true,
        firstname: true,
        id: true,
        lastLoginAt: true,
        lastname: true,
        role: true,
      },
      where: {
        OR: [{ firstname: { contains: query } }, { lastname: { contains: query } }, { email: { contains: query } }],
      },
    })
    const users = foundUsers.map(({ createdAt, email, firstname, id, lastLoginAt, lastname, role }) => ({
      createdAt,
      email,
      firstname,
      id,
      lastLoginAt,
      lastname,
      role,
    }))
    return {
      userCount: users.length,
      users,
    }
  }

  async findByEmail(email: string): Promise<TUser | null> {
    return this.prisma.user.findUnique({
      where: { email },
    })
  }

  async update(id: string, data: Partial<TUser>): Promise<TUser> {
    return this.prisma.user.update({
      data,
      where: { id },
    })
  }

  async create(user: TCreateUser): Promise<TUser> {
    return this.prisma.user.create({
      data: user,
    })
  }

  async getByToken(accessToken: string): Promise<TUser> {
    return this.prisma.user.findFirstOrThrow({
      where: {
        sessions: { some: { accessToken } },
      },
    })
  }

  async delete(id: string): Promise<void> {
    await Promise.all([this.prisma.session.deleteMany({ where: { userId: id } }), this.prisma.user.delete({ where: { id } })])
  }
}
