import { Body, Controller, HttpCode, HttpStatus, Post, Res } from '@nestjs/common'
import { Role } from '@prisma/client'
import { Response } from 'express'
import { User } from '~/common/decorators/authenticated-user'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { ExportPowerpointService } from '~/export-powerpoint/export-powerpoint.service'
import { TRequestPowerpoint } from '~/schemas/simulations/simulation'
import { TUser } from '~/schemas/users/user'
import { SimulationsService } from '~/simulations/simulations.service'

@Controller('export-powerpoint')
export class ExportPowerpointController {
  constructor(
    private readonly exportPowerpointService: ExportPowerpointService,
    private readonly simulationsService: SimulationsService,
  ) {}

  @AccessControl({
    roles: [Role.USER, Role.ADMIN],
  })
  @Post()
  @HttpCode(HttpStatus.OK)
  async requestPowerpoint(@User() user: TUser, @Body() data: TRequestPowerpoint, @Res() res: Response) {
    // const { selectedSimulations, privilegedSimulation } = data
    const buffer = await this.exportPowerpointService.generateFromTemplate({ ...data, username: `${user.firstname} ${user.lastname}` })
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation')
    res.setHeader('Content-Disposition', `attachment; filename="Votre scenario Otelo.pptx"`)
    res.send(buffer)

    // todo - handle
    // await this.simulationsService.markAsExported(data.selectedSimulations)
    // const simulations = await this.simulationsService.getMany(selectedSimulations)

    // const privilegedSim = data.privilegedSimulation ? simulations.find((sim) => sim.id === privilegedSimulation) : null

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
