import { Body, Controller, HttpCode, HttpStatus, Param, Post, Res } from '@nestjs/common'
import { Role } from '@prisma/client'
import { Response } from 'express'
import { User } from '~/common/decorators/authenticated-user'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { ExportPowerpointService } from '~/export-powerpoint/export-powerpoint.service'
import { TRequestPowerpoint } from '~/schemas/simulations/simulation'
import { TUser } from '~/schemas/users/user'

@Controller('export-powerpoint')
export class ExportPowerpointController {
  constructor(private readonly exportPowerpointService: ExportPowerpointService) {}

  @AccessControl({
    roles: [Role.USER, Role.ADMIN],
  })
  @Post(':simulationId')
  @HttpCode(HttpStatus.OK)
  async requestPowerpoint(
    @User() user: TUser,
    @Param('simulationId') simulationId: string,
    @Body() data: TRequestPowerpoint,
    @Res() res: Response,
  ) {
    const mockdata = {
      nextStep: 'Atelier de travail',
      resultDate: new Date('2025-10-10').toLocaleDateString('fr-FR'),
      selectedSimulations: [
        '4d60a197-f284-429d-a842-e76a01680764',
        'af48324a-209d-494b-8f1b-d7ae2b713a8e',
        '7df4487a-f1ab-4873-8d14-8ac65aca54c0',
      ],
      privilegedSimulation: '4d60a197-f284-429d-a842-e76a01680764',
      documentType: "Document d'Urbanisme",
      periodStart: '2026',
      periodEnd: '2032',
      epci: { code: '245901160', name: 'CA Valenciennes Métropole' },
      username: `${user.firstname} ${user.lastname}`,
    }
    const buffer = await this.exportPowerpointService.generateFromTemplate(mockdata)
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation')
    res.setHeader('Content-Disposition', `attachment; filename="Votre scenario Otelo.pptx"`)
    res.send(buffer)
    // await this.simulationsService.markAsExported(selectedSimulations)

    // Prepare email content
    // const privilegedSim = privilegedSimulation ? simulations.find((sim) => sim.id === privilegedSimulation) : null

    // const htmlContent = `
    //   <h1>Demande de PowerPoint</h1>
    //   <p><strong>Email de l'utilisateur:</strong> ${email}</p>
    //   <p><strong>Prochaine étape:</strong> ${nextStep}</p>
    //   <p><strong>Date du résultat:</strong> ${resultDate}</p>
    //   ${privilegedSim ? `<p><strong>Scénario privilégié:</strong> ${privilegedSim.name}</p>` : ''}
    //   <p><strong>Simulations sélectionnées:</strong></p>
    //   <ul>
    //     ${simulations.map((sim) => `<li>${sim.name}</li>`).join('')}
    //   </ul>
    // `

    // try {
    //   // Send email
    //   await this.emailService.sendEmail({
    //     to: this.receiverEmail,
    //     subject: 'Nouvelle demande de PowerPoint',
    //     html: htmlContent,
    //     text: `Demande de PowerPoint\n\nEmail de l'utilisateur: ${email}\nProchaine étape: ${nextStep}\nDate du résultat: ${resultDate}${privilegedSim ? `\nScénario privilégié: ${privilegedSim.name}` : ''}\nSimulations sélectionnées:\n${simulations.map((sim) => `- ${sim.name}`).join('\n')}`,
    //   })

    //   return { success: true, message: 'Email sent successfully' }
    // } catch (err) {
    //   this.logger.error(err)
    //   return { success: false, message: 'An error occurred while sending email.' }
    // }
  }
}
