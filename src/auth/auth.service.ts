import { Injectable } from '@nestjs/common'
import { Prisma, Role } from '@prisma/client'
import { Request } from 'express'
import { ScenariosService } from '~/scenarios/scenarios.service'
import { TSignupCallback } from '~/schemas/auth/sign-in-callback'
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

  async validateSignIn(signInData: TSignupCallback) {
    const { email } = signInData

    let user = await this.usersService.findByEmail(email)

    if (!user) {
      user = await this.usersService.create({
        email,
        firstname: signInData.firstname,
        provider: 'proconnect',
        sub: signInData.sub,
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

  async logout(userId: string) {
    return this.sessionsService.deleteUserSessions(userId)
  }
}
