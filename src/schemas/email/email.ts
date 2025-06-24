import { z } from 'zod'

export const ZEmailDto = z.object({
  to: z.string().email(),
  subject: z.string(),
  html: z.string(),
  text: z.string().optional(),
  from: z.string().email().optional(),
  senderName: z.string().optional(),
})

export type TEmailDto = z.infer<typeof ZEmailDto>
