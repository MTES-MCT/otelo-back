import { Injectable, UnauthorizedException } from '@nestjs/common'
import { Prisma, Role } from '@prisma/client'
import * as argon2 from 'argon2'
import { Request } from 'express'
import { ScenariosService } from '~/scenarios/scenarios.service'
import { TSignIn } from '~/schemas/auth/sign-in'
import { TSignupCallback } from '~/schemas/auth/sign-in-callback'
import { TSignUp } from '~/schemas/auth/sign-up'
import { TSession } from '~/schemas/sessions/session'
import { TUser } from '~/schemas/users/user'
import { SessionsService } from '~/sessions/sessions.service'
import { SimulationsService } from '~/simulations/simulations.service'
import { UsersService } from '~/users/users.service'

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly simulationsService: SimulationsService,
    private readonly sessionsService: SessionsService,
    private readonly scenariosService: ScenariosService,
  ) {}

  private async hashPassword(password: string): Promise<string> {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    })
  }

  async validateProConnectSignIn(signInData: TSignupCallback) {
    const { email } = signInData

    let user = await this.usersService.findByEmail(email)

    if (!user) {
      user = await this.usersService.create({
        email,
        firstname: signInData.firstname,
        provider: 'proconnect',
        sub: signInData.sub ?? null,
        lastname: signInData.lastname,
        emailVerified: new Date(),
      })
    }
    const session = await this.sessionsService.upsert(user)
    await this.usersService.update(user.id, {
      lastLoginAt: new Date(),
    })

    return {
      session,
      user,
    }
  }

  async signUp(signUpData: TSignUp) {
    const user = await this.usersService.create({
      email: signUpData.email,
      sub: null,
      firstname: signUpData.firstname,
      lastname: signUpData.lastname,
      emailVerified: null,
      provider: 'credentials',
      password: await this.hashPassword(signUpData.password),
    })
    const session = await this.sessionsService.upsert(user)
    await this.usersService.update(user.id, {
      lastLoginAt: new Date(),
    })
    return {
      session,
      user,
    }
  }

  async verifyPassword(hash: string | null | undefined, password: string): Promise<boolean> {
    if (!hash) {
      return false
    }

    try {
      return await argon2.verify(hash, password)
    } catch (error) {
      console.error(error)
      return false
    }
  }

  async signIn(signInData: TSignIn) {
    const user = await this.usersService.findByEmail(signInData.email, { password: true })
    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const isPasswordValid = await this.verifyPassword(user.password, signInData.password)
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    await this.sessionsService.upsert(user)
    await this.usersService.update(user.id, {
      lastLoginAt: new Date(),
    })
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  async refreshToken(refreshToken: string): Promise<{
    session: TSession
    user: TUser
  }> {
    return this.sessionsService.refreshTokens(refreshToken)
  }

  hasRole(user: TUser | undefined, roles: Role[]): boolean {
    const userRole = user?.role
    return roles.some((role) => role === userRole)
  }

  async canAccessEntity(entity: unknown, paramName: string, user: TUser | undefined, request: Request): Promise<boolean> {
    const entityId: string = paramName && request.params[paramName]
    if (user) {
      switch (entity) {
        case Prisma.ModelName.Scenario:
          return this.scenariosService.hasUserAccessTo(entityId, user.id)
        case Prisma.ModelName.Simulation:
          return this.simulationsService.hasUserAccessTo(entityId, user.id)
        default:
          throw new Error(`Entity not supported in Control Access`)
      }
    }

    return false
  }

  async hasAccess(email: string) {
    return this.usersService.hasUserAccessTo(email)
  }

  async logout(userId: string) {
    return this.sessionsService.deleteUserSessions(userId)
  }
}
