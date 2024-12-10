import { z } from 'zod'

export const ZSignupCallback = z.object({
  email: z.string().email(),
})

export type TSignupCallback = z.infer<typeof ZSignupCallback>
