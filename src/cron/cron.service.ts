import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Cron, CronExpression } from '@nestjs/schedule'
import { firstValueFrom } from 'rxjs'
import { z } from 'zod'
import { PrismaService } from '~/db/prisma.service'
import { DossierNode, GraphQLResponse } from './interfaces/demarches-simplifiees.interface'

const query = `
    query GetDossiers($after: String, $id: Int!) {
        demarche(number: $id) {
            id
            title
            dossiers(after: $after, first: 100) {
            pageInfo {
                hasPreviousPage
                hasNextPage
                startCursor
                endCursor
            }
            nodes {
                id
                state
                dateDepot
                dateDerniereModification
                usager {
                 email
                }
             }
            }
        }
    }
`

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name)
  private readonly graphqlUrl: string
  private readonly graphqlToken: string
  private readonly demarcheId: number

  constructor(
    private readonly httpService: HttpService,
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.graphqlUrl = z.string().parse(this.configService.get<string>('DEMARCHES_SIMPLIFIEES_URL'))
    this.graphqlToken = z.string().parse(this.configService.get<string>('DEMARCHES_SIMPLIFIEES_TOKEN'))
    this.demarcheId = z
      .string()
      .transform((val) => parseInt(val))
      .parse(this.configService.get<string>('DEMARCHES_SIMPLIFIEES_DEMARCHE_ID'))
  }

  private anonymizeEmail(email: string): string {
    const [localPart, domain] = email.split('@')
    if (!domain) {
      return email
    }

    // If local part is too short, just show first and last character
    if (localPart.length <= 4) {
      if (localPart.length <= 2) {
        return `${localPart}@${domain}`
      }
      return `${localPart[0]}***${localPart[localPart.length - 1]}@${domain}`
    }

    const firstThree = localPart.substring(0, 2)
    const lastThree = localPart.substring(localPart.length - 2)
    const asterisks = '*'.repeat(localPart.length - 4)

    return `${firstThree}${asterisks}${lastThree}@${domain}`
  }

  @Cron(CronExpression.EVERY_12_HOURS)
  async handleUserAccessUpdate() {
    this.logger.log('Starting user access update CRON job')

    try {
      await this.processAllDossiers()
      this.logger.log('User access update CRON job completed successfully')
    } catch (error) {
      this.logger.error('Error in user access update CRON job:', error)
    }
  }

  private async processAllDossiers(): Promise<void> {
    let hasNextPage = true
    let cursor: string | null = null
    const acceptedEmails = new Set<string>()

    while (hasNextPage) {
      try {
        const response = await this.fetchDossiers(cursor)
        const dossiers = response.data.demarche.dossiers
        this.processDossiersPage(dossiers.nodes, acceptedEmails)
        hasNextPage = dossiers.pageInfo.hasNextPage
        cursor = dossiers.pageInfo.endCursor
        this.logger.log(`Processed page, hasNextPage: ${hasNextPage}`)
      } catch (error) {
        this.logger.error('Error fetching dossiers:', error)
        break
      }
    }

    await this.updateUserAccess(acceptedEmails)
  }

  private processDossiersPage(nodes: DossierNode[], acceptedEmails: Set<string>): void {
    for (const dossier of nodes) {
      if (dossier.state === 'accepte' && dossier.usager?.email) {
        acceptedEmails.add(dossier.usager.email.toLowerCase())
        this.logger.debug(`Found accepted dossier for email: ${this.anonymizeEmail(dossier.usager.email)}`)
      }
    }
  }

  private async fetchDossiers(cursor: string | null = null): Promise<GraphQLResponse> {
    const variables: { after?: string; id: number } = {
      id: this.demarcheId,
      ...(cursor && { after: cursor }),
    }

    const response = await firstValueFrom(
      this.httpService.post<GraphQLResponse>(
        this.graphqlUrl,
        {
          query,
          variables,
        },
        {
          headers: {
            Authorization: `Bearer ${this.graphqlToken}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    )

    return response.data
  }

  private async updateUserAccess(acceptedEmails: Set<string>): Promise<void> {
    if (acceptedEmails.size === 0) {
      this.logger.log('No accepted dossiers found')
      return
    }

    try {
      const updateResult = await this.prismaService.user.updateMany({
        where: {
          AND: [
            {
              email: {
                in: Array.from(acceptedEmails),
              },
              hasAccess: false,
            },
            {
              hasAccess: true,
            },
          ],
        },
        data: {
          hasAccess: true,
        },
      })

      this.logger.log(`Updated ${updateResult.count} users with access permissions`)
    } catch (error) {
      this.logger.error('Error updating user access:', error)
      throw error
    }
  }
}
