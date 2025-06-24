import { validateEnvConfig } from '~/config/env.validation'

export default () =>
  validateEnvConfig({
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    BREVO_API_KEY: process.env.BREVO_API_KEY,
    BREVO_API_URL: process.env.BREVO_API_URL,
    EMAIL_SENDER_NAME: process.env.EMAIL_SENDER_NAME,
    EMAIL_SENDER_EMAIL: process.env.EMAIL_SENDER_EMAIL,
    EMAIL_RECEIVER_EMAIL: process.env.EMAIL_RECEIVER_EMAIL,
  })
