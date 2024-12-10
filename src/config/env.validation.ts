import { z } from 'zod'

const ZEnvSchema = z.object({
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  NODE_ENV: z.string(),
  PORT: z.string().transform((val) => parseInt(val)),
})

export const validateEnvConfig = (config: Record<string, unknown>): Record<string, unknown> => ZEnvSchema.parse(config)
