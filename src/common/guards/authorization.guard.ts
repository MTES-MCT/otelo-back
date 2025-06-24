import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Role } from '@prisma/client'
import { Request } from 'express'
import { AuthService } from '~/auth/auth.service'
import { ACCESS_CONTROL_KEY, TModelAccess } from '~/common/decorators/control-access.decorator'
import { IS_PUBLIC_KEY } from '~/common/decorators/public.decorator'
import { TUser } from '~/schemas/users/user'

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()])) {
      return Promise.resolve(true)
    }
    const request = context.switchToHttp().getRequest<Request & { user: TUser }>()
    const user = request.user

    if (request.user.role === Role.ADMIN) {
      return Promise.resolve(true)
    }
    const modelAccess = this.reflector.getAllAndOverride<TModelAccess>(ACCESS_CONTROL_KEY, [context.getHandler(), context.getClass()])

    if (!modelAccess) {
      return Promise.resolve(false)
    }

    if (!this.authService.hasRole(user, modelAccess.roles)) {
      return Promise.resolve(false)
    }

    if (modelAccess.entity) {
      return this.authService.canAccessEntity(modelAccess.entity, modelAccess.paramName || '', user, request)
    }

    return Promise.resolve(true)
  }
}
