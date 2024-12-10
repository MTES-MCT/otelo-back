import { z } from 'zod'
import { ZCommonDateFields } from '~/schemas/common-date-fields'

export const ZSession = ZCommonDateFields.omit({
  updatedAt: true,
}).extend({
  accessToken: z.string().min(1),
  expiresAt: z.date(),
  id: z.string(),
  refreshToken: z.string().min(1),
  userId: z.string().min(1),
})
export type TSession = z.infer<typeof ZSession>
