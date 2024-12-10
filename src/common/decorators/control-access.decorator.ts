import { SetMetadata } from '@nestjs/common'
import { Role } from '@prisma/client'

export const ACCESS_CONTROL_KEY = 'access-control'

export type TModelAccess = {
  entity?: unknown
  paramName?: string
  roles: Role[]
}

export const AccessControl = (modelAccess: TModelAccess) => SetMetadata(ACCESS_CONTROL_KEY, modelAccess)
