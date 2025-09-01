import { HttpService } from '@nestjs/axios'
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'
import { TEmailDto } from '~/schemas/email/email'
import { TUser } from '~/schemas/users/user'
import { IEmailService } from './interfaces/email-service.interface'

@Injectable()
export class EmailService implements IEmailService {
  private readonly logger = new Logger(EmailService.name)
  private readonly apiUrl: string
  private readonly apiKey: string
  private readonly defaultSender: { name: string; email: string }

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.apiKey = this.configService.getOrThrow<string>('BREVO_API_KEY')
    this.apiUrl = this.configService.getOrThrow<string>('BREVO_API_URL')
    const senderName = this.configService.getOrThrow<string>('EMAIL_SENDER_NAME')
    const senderEmail = this.configService.getOrThrow<string>('EMAIL_SENDER_EMAIL')

    // Set default sender
    this.defaultSender = {
      name: senderName,
      email: senderEmail,
    }
  }

  /**
   * Sends an email using Brevo API
   * @param options Email options
   */
  async sendEmail(options: TEmailDto): Promise<void> {
    try {
      this.logger.log(`Sending email to ${options.to}`)

      const payload = {
        subject: options.subject,
        htmlContent: options.html,
        textContent: options.text,
        sender: {
          name: options.senderName || this.defaultSender.name,
          email: options.from || this.defaultSender.email,
        },
        to: [{ email: options.to }],
      }

      const headers = {
        accept: 'application/json',
        'api-key': this.apiKey,
        'content-type': 'application/json',
      }

      await firstValueFrom(this.httpService.post(this.apiUrl, payload, { headers }))

      this.logger.log(`Email sent successfully to ${options.to}`)
    } catch (error) {
      this.logger.error(`Failed to send email:`, { error })
      throw new InternalServerErrorException('Failed to send email')
    }
  }

  /**
   * Sends an email using a template
   * @param template The template ID in Brevo
   * @param data The data to populate the template with
   * @param to The recipient email address
   * @param subject The email subject
   */
  async sendTemplatedEmail(template: string, data: Record<string, string>, to: string, subject: string): Promise<void> {
    try {
      this.logger.log(`Sending templated email to ${to} using template ${template}`)

      const payload = {
        templateId: parseInt(template, 10),
        params: data,
        subject: subject,
        to: [{ email: to }],
        sender: this.defaultSender,
      }

      const headers = {
        accept: 'application/json',
        'api-key': this.apiKey,
        'content-type': 'application/json',
      }

      await firstValueFrom(this.httpService.post(this.apiUrl, payload, { headers }))

      this.logger.log(`Templated email sent successfully to ${to}`)
    } catch (error) {
      this.logger.error(`Failed to send email:`, { error })
      throw new InternalServerErrorException('Failed to send templated email')
    }
  }

  async sendEmailVerificationEmail(user: TUser, confirmationUri: string): Promise<void> {
    const htmlContent = `
    <!doctype html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <meta http-equiv="x-ua-compatible" content="ie=edge">
      <title>Vérifiez votre adresse e-mail</title>
      <style>
        /* Mobile */
        @media only screen and (max-width:600px){
          .container{width:100% !important; border-radius:0 !important}
          .px{padding-left:20px !important; padding-right:20px !important}
        }
      </style>
    </head>
    <body style="margin:0; padding:0; background:#f6f9fc;" bgcolor="#f6f9fc">
      <div style="display:none; font-size:1px; color:#f6f9fc; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">
        Confirmez votre adresse e-mail pour activer votre compte Otelo.
      </div>

      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" bgcolor="#f6f9fc" style="background:#f6f9fc; padding:24px 0;">
        <tr>
          <td align="center" bgcolor="#f6f9fc" style="background:#f6f9fc;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="600" bgcolor="#ffffff" class="container" style="width:600px; background:#ffffff; border-radius:14px; box-shadow:0 2px 8px rgba(0,0,0,.06);">
              <tr>
                <td class="px" style="padding:16px 32px 0 32px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; color:#1f2937;">
                  <h1 style="margin:0 0 12px 0; font-size:24px; line-height:1.3; font-weight:700;">Vérifiez votre adresse e-mail</h1>
                  <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6;">
                    Bonjour ${user.firstname},<br>
                    Merci de vous être inscrit(e) sur <strong>Otelo</strong> !
                  </p>
                  <p style="margin:0 0 20px 0; font-size:16px; line-height:1.6;">
                    Pour activer votre compte, confirmez votre adresse e-mail en cliquant sur le bouton ci-dessous :
                  </p>
                </td>
              </tr>

              <!-- Bouton -->
              <tr>
                <td align="left" class="px" style="padding:4px 32px 0 32px;">
                  <!--[if mso]>
                  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${confirmationUri}" style="height:48px;v-text-anchor:middle;width:300px;" arcsize="12%" fillcolor="#4F46E5" stroke="f">
                    <w:anchorlock/>
                    <center style="color:#ffffff;font-family:Segoe UI, Arial, sans-serif;font-size:16px;font-weight:700;">
                      Vérifier mon adresse e-mail
                    </center>
                  </v:roundrect>
                  <![endif]-->
                  <!--[if !mso]><!-- -->
                  <a href="${confirmationUri}" target="_blank"
                    style="display:inline-block; background:#4F46E5; color:#ffffff; text-decoration:none; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; font-weight:700; font-size:16px; line-height:48px; height:48px; padding:0 24px; border-radius:6px; min-width:260px; text-align:center;">
                    Vérifier mon adresse e-mail
                  </a>
                  <!--<![endif]-->
                </td>
              </tr>

              <tr>
                <td class="px" style="padding:18px 32px 0 32px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; color:#1f2937;">
                  <p style="margin:0 0 12px 0; font-size:14px; line-height:1.6;">
                    Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
                  </p>
                  <p style="margin:0; font-size:12px; line-height:1.6; word-break:break-all; overflow-wrap:anywhere;">
                    <a href="${confirmationUri}" target="_blank" style="color:#4F46E5; text-decoration:underline;">${confirmationUri}</a>
                  </p>
                </td>
              </tr>

              <tr>
                <td class="px" style="padding:20px 32px 0 32px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; color:#1f2937;">
                  <p style="margin:0 0 8px 0; font-size:14px; line-height:1.6;">
                    ⚠️ Ce lien est valable pendant 24&nbsp;heures.
                  </p>
                  <p style="margin:0 0 24px 0; font-size:13px; line-height:1.6; color:#6b7280;">
                    Si vous n’êtes pas à l’origine de cette inscription, vous pouvez ignorer ce message.
                  </p>
                </td>
              </tr>

              <tr>
                <td class="px" style="padding:0 32px 28px 32px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
                  <hr style="border:none; border-top:1px solid #e5e7eb; margin:0 0 16px 0;">
                  <p style="margin:0; font-size:12px; color:#6b7280; line-height:1.6;">
                    © ${new Date().getFullYear()} Otelo. Tous droits réservés.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `
    await this.sendEmail({
      html: htmlContent,
      to: user.email,
      subject: 'Vérification de votre inscription sur Otelo',
    })
  }
}
