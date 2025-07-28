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

export const ZContactDto = z.object({
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  email: z.string().email(),
  subject: z.string().min(1),
  message: z.string().min(1),
})

export type TContactDto = z.infer<typeof ZContactDto>
