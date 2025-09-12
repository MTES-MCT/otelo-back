import { Injectable, Logger } from '@nestjs/common'
import { DemographicEvolutionService } from '~/demographic-evolution/demographic-evolution.service'
import { PlaceholderGenerationService } from '~/export-powerpoint/placeholder-generation/placeholder-generation.service'
import { ZipService } from '~/export-powerpoint/zip/zip.service'
import { TPowerpointPlaceholders } from '~/schemas/export-powerpoint/export-powerpoint'
import { TRequestPowerpoint } from '~/schemas/simulations/simulation'

@Injectable()
export class ExportPowerpointService {
  private readonly logger = new Logger(ExportPowerpointService.name)
  constructor(
    private readonly zipService: ZipService,
    private readonly placeholderService: PlaceholderGenerationService,
    private readonly demographicEvolutionService: DemographicEvolutionService,
  ) {}

  private async generatePlaceholders(data: TRequestPowerpoint): Promise<TPowerpointPlaceholders> {
    const demographicData = await this.demographicEvolutionService.getDemographicEvolutionPopulationByEpci('200033579')
    return {
      slide1: { text: { date: new Date(data.resultDate).toLocaleDateString('fr-FR'), title: 'Title', subtitle: 'Subtitle' } },
      slide2: { text: { scenario: 'TOTO' } },
      slide4: { text: { layoutTitle: 'Layout Title', layoutSubtitle: 'Layout Subtitle' } },
      slide6: { text: { layoutTitle: 'Layout Title', layoutSubtitle: 'Layout Subtitle' } },
      slide8: {
        text: {
          layoutTitle: 'Layout Title',
          layoutSubtitle: 'Layout Subtitle',
          title: 'Évolution démographique attendue TATA',
          subtitle: 'Une population stable mais des ménages en hausse TOTO',
        },
        charts: [
          {
            placeholder: '[CHART]',
            data: demographicData['200033579'].data,
            templateImageFileName: 'image6.png',
            width: 800,
            height: 500,
          },
        ],
      },
    }
  }

  async generateFromTemplate(data: TRequestPowerpoint): Promise<Buffer> {
    // todo: use values from those
    // const simulations = await this.simulationsService.getMany(selectedSimulations)

    const zip = await this.zipService.unzipPptx()
    const slideFiles = Object.keys(zip.files).filter((name) => name.match(/^ppt\/slides\/slide\d+\.xml$/))

    for (const slideFile of slideFiles) {
      this.logger.log(`Processing slide ${slideFile}`)
      const slideName = slideFile.split('/').pop()!.replace('.xml', '')
      const slideXml = await zip.files[slideFile].async('text')
      const placeholders = await this.generatePlaceholders(data)

      const modifiedSlideXml = await this.placeholderService.processSlide(slideXml, slideName, placeholders, zip)
      zip.file(slideFile, modifiedSlideXml)
    }

    this.logger.log(`Generating PowerPoint file`)
    const pptxBuffer = await this.zipService.generatePptx(zip)
    // todo: mark simulations as exported
    // await this.simulationsService.markAsExported(data.simulations)
    return pptxBuffer
  }
}
