import { UserType } from '@prisma/client'
import { z } from 'zod'

export const ZUpdateUserType = z.object({
  type: z.nativeEnum(UserType),
})

export type TUpdateUserType = z.infer<typeof ZUpdateUserType>
