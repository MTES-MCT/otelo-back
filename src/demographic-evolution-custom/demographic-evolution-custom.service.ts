import { BadRequestException, Injectable } from '@nestjs/common'
import { DemographicEvolutionOmphaleCustom } from '@prisma/client'
import * as Papa from 'papaparse'
import { z } from 'zod'
import { PrismaService } from '~/db/prisma.service'
import {
  TCreateDemographicEvolutionCustomDto,
  ZDemographicEvolutionCustomFile,
} from '~/schemas/demographic-evolution-custom/demographic-evolution-custom'

@Injectable()
export class DemographicEvolutionCustomService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(userId: string, data: TCreateDemographicEvolutionCustomDto) {
    // Check if a record already exists
    const existing = await this.prisma.demographicEvolutionOmphaleCustom.findFirst({
      where: {
        epciCode: data.epciCode,
        scenarioId: data.scenarioId || null,
      },
    })

    if (existing) {
      // Update existing record
      return this.prisma.demographicEvolutionOmphaleCustom.update({
        where: { id: existing.id },
        data: {
          data: data.data,
          userId,
          updatedAt: new Date(),
        },
      })
    }

    // Create new record
    return this.prisma.demographicEvolutionOmphaleCustom.create({
      data: {
        data: data.data,
        userId,
        epciCode: data.epciCode,
        scenarioId: data.scenarioId,
      },
    })
  }

  async hasUserAccessTo(id: string, userId: string): Promise<boolean> {
    return !!(await this.prisma.demographicEvolutionOmphaleCustom.findFirst({
      where: { id, userId },
    }))
  }

  async findManyByUser(ids: string[], userId: string) {
    return this.prisma.demographicEvolutionOmphaleCustom.findMany({
      where: {
        id: { in: ids },
        userId: userId,
      },
    })
  }

  async findManyByScenarioAndEpci(scenarioId: string, epciCode: string) {
    return this.prisma.demographicEvolutionOmphaleCustom.findFirst({
      where: {
        scenarioId,
        epciCode,
      },
    })
  }

  async delete(id: string, userId: string) {
    return this.prisma.demographicEvolutionOmphaleCustom.delete({
      where: { id, userId },
    })
  }

  async parseUploadedFile(buffer: Buffer, mimetype: string): Promise<DemographicEvolutionOmphaleCustom['data']> {
    if (!['text/csv', 'application/csv'].includes(mimetype)) {
      throw new BadRequestException('Unsupported file format. Please use CSV or Excel files.')
    }
    const text = buffer.toString('utf-8')

    // Parse CSV using Papaparse
    const parseResult = Papa.parse(text, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    })

    if (parseResult.errors.length > 0) {
      throw new BadRequestException(`CSV parsing errors: ${parseResult.errors.map((e) => e.message).join(', ')}`)
    }

    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const data = parseResult.data as Record<string, any>[]

    // Validate CSV structure using Zod
    try {
      // First validate that the CSV has the expected structure
      ZDemographicEvolutionCustomFile.parse(data)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors.map((err) => err.message).join(', ')
        throw new BadRequestException(`Invalid CSV format: ${errorMessage}`)
      }
      throw error
    }

    // Extract MENAGES columns and calculate sums
    const yearData: Array<{ year: number; value: number }> = []
    const headers = Object.keys(data[0])

    // Find all MENAGES_{YEAR} columns
    const menagesColumns = headers.filter((header) => header.startsWith('MENAGES_'))

    for (const column of menagesColumns) {
      // Extract year from column name (MENAGES_2018 -> 2018)
      const yearMatch = column.match(/MENAGES_(\d{4})/)
      if (!yearMatch) continue

      const year = parseInt(yearMatch[1], 10)

      // Sum all values in this column
      let sum = 0
      for (const row of data) {
        const value = row[column]
        if (typeof value === 'number' && !isNaN(value)) {
          sum += value
        }
      }

      // Only include columns where sum is not zero
      if (sum !== 0) {
        yearData.push({ year, value: sum })
      }
    }

    // Sort by year
    yearData.sort((a, b) => a.year - b.year)

    return yearData
  }
}
