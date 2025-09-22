import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Post, Put } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Prisma, Role } from '@prisma/client'
import { User } from '~/common/decorators/authenticated-user'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { EmailService } from '~/email/email.service'
import { TUpdateSimulationDto } from '~/schemas/scenarios/scenario'
import { TInitSimulation } from '~/schemas/simulations/create-simulation'
import { TCloneSimulationDto, TRequestPowerpoint } from '~/schemas/simulations/simulation'
import { TUser } from '~/schemas/users/user'
import { SimulationsService } from '~/simulations/simulations.service'

@Controller('simulations')
export class SimulationsController {
  private readonly logger = new Logger(SimulationsController.name)
  private readonly receiverEmail: string

  constructor(
    private configService: ConfigService,
    private readonly simulationsService: SimulationsService,
    private readonly emailService: EmailService,
  ) {
    this.receiverEmail = this.configService.getOrThrow<string>('EMAIL_RECEIVER_EMAIL')
  }

  @AccessControl({
    roles: [Role.ADMIN, Role.USER],
  })
  @HttpCode(HttpStatus.OK)
  @Get('dashboard-list')
  async getDashboardList(@User() { id: userId }: TUser) {
    return this.simulationsService.getDashboardList(userId)
  }

  @AccessControl({
    entity: Prisma.ModelName.Simulation,
    paramName: 'id',
    roles: [Role.ADMIN, Role.USER],
  })
  @Get(':id/scenario')
  @HttpCode(HttpStatus.OK)
  async getSimulationScenario(@Param('id') id: string) {
    return this.simulationsService.getScenario(id)
  }

  @AccessControl({
    entity: Prisma.ModelName.Simulation,
    paramName: 'id',
    roles: [Role.ADMIN, Role.USER],
  })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getSimulation(@Param('id') id: string) {
    return this.simulationsService.get(id)
  }

  @AccessControl({
    roles: [Role.ADMIN, Role.USER],
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() data: TInitSimulation, @User() { id: userId }: TUser) {
    return this.simulationsService.create(userId, data)
  }

  @AccessControl({
    entity: Prisma.ModelName.Simulation,
    paramName: 'id',
    roles: [Role.ADMIN, Role.USER],
  })
  @Put(':id/scenario')
  @HttpCode(HttpStatus.ACCEPTED)
  async updateSimulation(@Param('id') id: string, @Body() data: TUpdateSimulationDto) {
    return this.simulationsService.update(id, data)
  }

  @AccessControl({
    entity: Prisma.ModelName.Simulation,
    paramName: 'id',
    roles: [Role.ADMIN, Role.USER],
  })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSimulation(@Param('id') id: string, @User() { id: userId }: TUser) {
    return this.simulationsService.delete(userId, id)
  }

  @AccessControl({
    entity: Prisma.ModelName.Simulation,
    paramName: 'id',
    roles: [Role.ADMIN, Role.USER],
  })
  @Post(':id/clone')
  @HttpCode(HttpStatus.CREATED)
  async cloneSimulation(@Param('id') id: string, @Body() data: TCloneSimulationDto, @User() { id: userId }: TUser) {
    return this.simulationsService.clone(userId, id, data)
  }

  @AccessControl({
    roles: [Role.USER, Role.ADMIN],
  })
  @Post('request-powerpoint')
  @HttpCode(HttpStatus.OK)
  async requestPowerpoint(@User() { email }: TUser, @Body() data: TRequestPowerpoint) {
    const { nextStep, resultDate, selectedSimulations, privilegedSimulation } = data

    const simulations = await this.simulationsService.getMany(selectedSimulations)
    await this.simulationsService.markAsExported(selectedSimulations)

    // Prepare email content
    const privilegedSim = privilegedSimulation ? simulations.find((sim) => sim.id === privilegedSimulation) : null

    const htmlContent = `
      <h1>Demande de PowerPoint</h1>
      <p><strong>Email de l'utilisateur:</strong> ${email}</p>
      <p><strong>Prochaine étape:</strong> ${nextStep}</p>
      <p><strong>Date du résultat:</strong> ${resultDate}</p>
      ${privilegedSim ? `<p><strong>Scénario privilégié:</strong> ${privilegedSim.name}</p>` : ''}
      <p><strong>Simulations sélectionnées:</strong></p>
      <ul>
        ${simulations.map((sim) => `<li>${sim.name}</li>`).join('')}
      </ul>
    `

    try {
      // Send email
      await this.emailService.sendEmail({
        to: this.receiverEmail,
        subject: 'Nouvelle demande de PowerPoint',
        html: htmlContent,
        text: `Demande de PowerPoint\n\nEmail de l'utilisateur: ${email}\nProchaine étape: ${nextStep}\nDate du résultat: ${resultDate}${privilegedSim ? `\nScénario privilégié: ${privilegedSim.name}` : ''}\nSimulations sélectionnées:\n${simulations.map((sim) => `- ${sim.name}`).join('\n')}`,
      })

      return { success: true, message: 'Email sent successfully' }
    } catch (err) {
      this.logger.error(err)
      return { success: false, message: 'An error occurred while sending email.' }
    }
  }
}
