import { BadRequestException, Injectable } from '@nestjs/common'
import * as Papa from 'papaparse'
import { PrismaService } from '~/db/prisma.service'
import { TCreateDemographicEvolutionCustomDto } from '~/schemas/demographic-evolution-custom/demographic-evolution-custom'

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

  async parseUploadedFile(buffer: Buffer, mimetype: string): Promise<Array<{ year: number; value: number }>> {
    // For CSV files
    if (mimetype === 'text/csv' || mimetype === 'application/csv') {
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

      if (data.length === 0) {
        throw new BadRequestException('No data found in the CSV file')
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

      if (yearData.length === 0) {
        throw new BadRequestException('No valid MENAGES data found in the CSV file')
      }

      // Sort by year
      yearData.sort((a, b) => a.year - b.year)

      return yearData
    }

    // For Excel files (.xlsx, .xls)
    if (mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || mimetype === 'application/vnd.ms-excel') {
      // TODO: Implement Excel parsing using a library like 'xlsx' or 'exceljs'
      // For now, throw an error indicating Excel support is coming
      throw new BadRequestException('Excel file parsing is not yet implemented. Please use CSV format.')
    }

    throw new BadRequestException('Unsupported file format. Please use CSV or Excel files.')
  }
}
