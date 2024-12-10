import { validateEnvConfig } from '~/config/env.validation'

export default () =>
  validateEnvConfig({
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
  })
