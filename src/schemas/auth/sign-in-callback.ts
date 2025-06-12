import { z } from 'zod'

export const ZSignupCallback = z.object({
  email: z.string().email(),
  firstname: z.string(),
  lastname: z.string(),
  sub: z.string(),
  id: z.string(),
})

export type TSignupCallback = z.infer<typeof ZSignupCallback>
