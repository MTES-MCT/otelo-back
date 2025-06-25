import { Role } from '@prisma/client'
import { z } from 'zod'
import { ZCommonDateFields } from '~/schemas/common-date-fields'

export const ZUser = ZCommonDateFields.extend({
  email: z.string().email(),
  firstname: z.string(),
  id: z.string(),
  lastLoginAt: z.date(),
  emailVerified: z.date().nullable(),
  lastname: z.string(),
  provider: z.string().nullable(),
  role: z.enum([Role.ADMIN, Role.USER]),
  sub: z.string().nullable(),
  hasAccess: z.boolean(),
})

export type TUser = z.infer<typeof ZUser>

export const ZUserList = ZUser.pick({
  createdAt: true,
  email: true,
  firstname: true,
  id: true,
  lastLoginAt: true,
  lastname: true,
})

export type TUserList = z.infer<typeof ZUserList>
