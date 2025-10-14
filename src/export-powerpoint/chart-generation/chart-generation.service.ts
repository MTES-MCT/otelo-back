import { Injectable } from '@nestjs/common'
import * as puppeteer from 'puppeteer'

// todo: use zod schema instead and type it in the export-powerpoint calculators
interface ChartConfig {
  type: 'projection-population-evolution' | 'projection-menages-evolution' | 'bad-housing' | 'comparison-population-evolution-housing-needs'
  data: unknown
  metadata?: Record<string, unknown>
  width: number
  height: number
}

@Injectable()
export class ChartGenerationService {
  async generateChartImage(chartConfig: ChartConfig): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()

    const width = chartConfig.width || 800
    const height = chartConfig.height || 500

    await page.setViewport({ width, height })

    const html = this.generateRechartsHTML(chartConfig)
    await page.setContent(html)

    const screenshot = await page.screenshot({
      type: 'png',
      omitBackground: false,
    })
    await browser.close()
    return Buffer.from(screenshot)
  }

  private generateRechartsHTML(chartConfig: ChartConfig): string {
    switch (chartConfig.type) {
      case 'projection-population-evolution':
        return this.generatePopulationChart(chartConfig)
      case 'projection-menages-evolution':
        return this.generateMenagesChart(chartConfig)
      case 'bad-housing':
        return this.generateBadHousingChart(chartConfig)
      case 'comparison-population-evolution-housing-needs':
        return this.generateComparisonPopulationChart(chartConfig)
      default:
        throw new Error('Invalid chart type')
    }
  }

  private generatePopulationChart(chartConfig: ChartConfig): string {
    return `
     <!DOCTYPE html>
      <html>

      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">

          <style>
              body {
                  margin: 0;
                  padding: 0;
                  background: white;
                  font-family: 'Calibri', Arial, sans-serif;
                  width: ${chartConfig.width || 800}px;
                  height: ${chartConfig.height || 500}px;
                  overflow: hidden;
              }

              #myChart {
                  width: ${chartConfig.width || 800}px;
                  height: ${chartConfig.height || 500}px;
              }
          </style>
      </head>

      <body>
          <div>
              <canvas id="myChart"></canvas>
          </div>

          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

          <script>
              const ctx = document.getElementById('myChart');

              const demographicData = ${JSON.stringify(chartConfig.data)};
              
              const chart = new Chart(ctx, {
                  type: 'line',
                  data: {
                      labels: demographicData.map(item => item.year),
                      datasets: [
                          {
                              label: 'Central',
                              data: demographicData.map(item => item.central),
                              borderColor: 'rgb(75, 192, 192)',
                              backgroundColor: 'rgba(75, 192, 192, 0.1)',
                              tension: 0.1,
                              fill: false
                          },
                          {
                              label: 'Haute',
                              data: demographicData.map(item => item.haute),
                              borderColor: 'rgb(255, 99, 132)',
                              backgroundColor: 'rgba(255, 99, 132, 0.1)',
                              tension: 0.1,
                              fill: false
                          },
                          {
                              label: 'Basse',
                              data: demographicData.map(item => item.basse),
                              borderColor: 'rgb(54, 162, 235)',
                              backgroundColor: 'rgba(54, 162, 235, 0.1)',
                              tension: 0.1,
                              fill: false
                          }
                      ]
                  },
                  options: {
                      responsive: true,
                      maintainAspectRatio: false,
                      animation: false,
                      scales: {
                          x: {
                              title: {
                                  display: true,
                                  text: 'Année'
                              }
                          },
                          y: {
                              title: {
                                  display: true,
                                  text: 'Évolution'
                              },
                              beginAtZero: false,
                              min: ${JSON.stringify(chartConfig.metadata?.min)},
                              max: ${JSON.stringify(chartConfig.metadata?.max)}
                          }
                      },
                      plugins: {
                          legend: {
                              display: true,
                              position: 'top'
                          }
                      }
                  }
              });
          </script>
      </body>

      </html>
    `
  }

  private generateMenagesChart(chartConfig: ChartConfig): string {
    const width = chartConfig.width || 800
    const height = chartConfig.height || 500

    const defaultLinePalette = ['rgb(255, 99, 132)', 'rgb(75, 192, 192)', 'rgb(54, 162, 235)']
    const palette = defaultLinePalette
    const defaultLines = [
      {
        dataKey: 'centralH',
        name: 'Décohabitation accélérée',
        strokeWidth: 2,
      },
      {
        dataKey: 'centralC',
        name: 'Décohabitation tendancielle',
        strokeWidth: 2,
      },
      {
        dataKey: 'centralB',
        name: 'Décohabitation décélérée',
        strokeWidth: 2,
      },
    ]

    const lines = defaultLines

    const rawData = chartConfig.data as unknown
    let menagesData: Array<Record<string, number>> = Array.isArray(rawData) ? (rawData as Array<Record<string, number>>) : []
    let metadata = chartConfig.metadata as { min?: number; max?: number } | undefined

    if (!menagesData.length && rawData && typeof rawData === 'object') {
      // biome-ignore lint/suspicious/noExplicitAny: todo
      const values = Object.values(rawData as Record<string, any>)

      for (const entry of values) {
        if (entry && typeof entry === 'object' && Array.isArray(entry.data)) {
          menagesData = entry.data
          if (!metadata && entry.metadata) {
            metadata = entry.metadata
          }
          break
        }
      }
    }

    if (!metadata || typeof metadata.min !== 'number' || typeof metadata.max !== 'number') {
      const collectedValues: number[] = []
      menagesData.forEach((item) => {
        lines.forEach((line) => {
          const value = Number(item[line.dataKey])
          if (!Number.isNaN(value)) {
            collectedValues.push(value)
          }
        })
      })

      if (collectedValues.length) {
        metadata = {
          min: Math.min(...collectedValues),
          max: Math.max(...collectedValues),
        }
      } else {
        metadata = {}
      }
    }

    const datasetsConfig = lines.map((line, index) => ({
      dataKey: line.dataKey,
      label: line.name || line.dataKey,
      color: palette[index % palette.length],
      strokeWidth: line.strokeWidth ?? 2,
    }))

    const menagesDataJson = JSON.stringify(menagesData)
    const datasetsConfigJson = JSON.stringify(datasetsConfig)
    const yAxisMin = typeof metadata?.min === 'number' ? metadata.min : null
    const yAxisMax = typeof metadata?.max === 'number' ? metadata.max : null

    return `
     <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              margin: 0;
              padding: 0;
              background: white;
              font-family: 'Calibri', Arial, sans-serif;
              width: ${width}px;
              height: ${height}px;
              overflow: hidden;
            }

            #menagesChart {
              width: ${width}px;
              height: ${height}px;
            }
          </style>
        </head>

        <body>
          <div>
            <canvas id="menagesChart"></canvas>
          </div>

          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
          <script>
            const ctx = document.getElementById('menagesChart')

            const menagesData = ${menagesDataJson};
            const datasetsConfig = ${datasetsConfigJson};
            const yAxisMin = ${JSON.stringify(yAxisMin)};
            const yAxisMax = ${JSON.stringify(yAxisMax)};

            const datasets = datasetsConfig.map((config, index) => ({
              label: config.label,
              data: menagesData.map((item) => {
                const value = item[config.dataKey]
                return typeof value === 'number' ? value : null
              }),
              borderColor: config.color,
              backgroundColor: config.color,
              borderWidth: config.strokeWidth || 2,
              tension: 0.2,
              pointRadius: 0,
              fill: false,
              spanGaps: true,
            }))

            new Chart(ctx, {
              type: 'line',
              data: {
                labels: menagesData.map((item) => item.year),
                datasets,
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                scales: {
                  x: {
                    title: {
                      display: true,
                      text: 'Année',
                    },
                  },
                  y: {
                    title: {
                      display: true,
                      text: 'Nombre de ménages',
                    },
                    beginAtZero: false,
                    min: yAxisMin,
                    max: yAxisMax,
                  },
                },
                plugins: {
                  legend: {
                    display: true,
                    position: 'top',
                  },
                },
              },
            })
          </script>
        </body>
      </html>
    `
  }

  private generateBadHousingChart(chartConfig: ChartConfig): string {
    const width = chartConfig.width || 800
    const height = chartConfig.height || 500

    const defaultBarPalette = ['rgb(239, 68, 68)', 'rgb(234, 179, 8)', 'rgb(59, 130, 246)', 'rgb(34, 197, 94)', 'rgb(168, 85, 247)']

    const palette = defaultBarPalette

    const data = chartConfig.data as {
      name: string
      hosted: { total: number }
      noAccommodation: { total: number }
      badQuality: number
      financialInadequation: number
      physicalInadequation: number
    }

    const labels = [data.name]

    const datasets = [
      {
        label: 'Sans logement',
        backgroundColor: palette[0],
        borderColor: palette[0],
        borderWidth: 1,
        data: [data.noAccommodation.total],
      },
      {
        label: 'Hébergés',
        backgroundColor: palette[1],
        borderColor: palette[1],
        borderWidth: 1,
        data: [data.hosted.total],
      },
      {
        label: 'Inadéquation financière',
        backgroundColor: palette[2],
        borderColor: palette[2],
        borderWidth: 1,
        data: [data.financialInadequation],
      },
      {
        label: 'Mauvaise qualité',
        backgroundColor: palette[3],
        borderColor: palette[3],
        borderWidth: 1,
        data: [data.badQuality],
      },
      {
        label: 'Inadéquation physique',
        backgroundColor: palette[4],
        borderColor: palette[4],
        borderWidth: 1,
        data: [data.physicalInadequation],
      },
    ]

    return `
     <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              margin: 0;
              padding: 0;
              background: white;
              font-family: 'Calibri', Arial, sans-serif;
              width: ${width}px;
              height: ${height}px;
              overflow: hidden;
            }

            #badHousingChart {
              width: ${width}px;
              height: ${height}px;
            }
          </style>
        </head>

        <body>
          <div>
            <canvas id="badHousingChart"></canvas>
          </div>

          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
          <script>
            const ctx = document.getElementById('badHousingChart')
            const labels = ${JSON.stringify(labels)};
            const datasets = ${JSON.stringify(datasets)};

            new Chart(ctx, {
              type: 'bar',
              data: {
                labels,
                datasets,
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                scales: {
                  x: {
                    stacked: false,
                  },
                  y: {
                    beginAtZero: true,
                  },
                },
                plugins: {
                  legend: {
                    display: true,
                    position: 'top',
                  },
                },
              },
            })
          </script>
        </body>
      </html>
    `
  }

  private generateComparisonPopulationChart(chartConfig: ChartConfig): string {
    const width = chartConfig.width || 800
    const height = chartConfig.height || 500

    const data = chartConfig.data as {
      housingNeeds: Record<number, number>
      populationEvolution: Record<string, { data: Array<{ year: number; central: number; haute: number; basse: number }> }>
      selectedScenario: string
    }

    // Get the first EPCI's population data
    const populationData = Object.values(data.populationEvolution)[0]?.data || []
    const housingNeedsData = data.housingNeeds
    const selectedScenario = data.selectedScenario
    console.log('data', data)

    // Create labels from years
    const years = populationData.map((item) => item.year)
    const labels = years.map((year) => year.toString())

    // Housing needs bar data
    const housingNeedsValues = years.map((year) => housingNeedsData[year] || 0)

    // Population evolution line data - only for selected scenario
    const populationValues = populationData.map((item) => item[selectedScenario as keyof typeof item] as number)

    const scenarioLabels = {
      central: 'Population - Central',
      haute: 'Population - Haute',
      basse: 'Population - Basse',
    }

    const scenarioColors = {
      central: 'rgb(75, 192, 192)',
      haute: 'rgb(255, 99, 132)',
      basse: 'rgb(54, 162, 235)',
    }

    return `
     <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              margin: 0;
              padding-top: 100px;
              background: white;
              font-family: 'Calibri', Arial, sans-serif;
              width: ${width}px;
              height: ${height}px;
              overflow: hidden;
            }

            #comparisonChart {
              width: ${width - 100}px;
              height: ${height - 100}px;
            }
          </style>
        </head>

        <body>
          <div>
            <canvas id="comparisonChart"></canvas>
          </div>

          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
          <script>
            const ctx = document.getElementById('comparisonChart')
            const labels = ${JSON.stringify(labels)};
            const housingNeedsValues = ${JSON.stringify(housingNeedsValues)};
            const populationValues = ${JSON.stringify(populationValues)};
            const selectedScenario = ${JSON.stringify(selectedScenario)};
            const scenarioLabels = ${JSON.stringify(scenarioLabels)};
            const scenarioColors = ${JSON.stringify(scenarioColors)};

            new Chart(ctx, {
              type: 'bar',
              data: {
                labels,
                datasets: [
                  {
                    label: 'Constructions neuves',
                    type: 'bar',
                    data: housingNeedsValues,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    yAxisID: 'y1'
                  },
                  {
                    label: scenarioLabels[selectedScenario],
                    type: 'line',
                    data: populationValues,
                    borderColor: scenarioColors[selectedScenario],
                    backgroundColor: scenarioColors[selectedScenario].replace('rgb', 'rgba').replace(')', ', 0.1)'),
                    tension: 0.1,
                    fill: false,
                    yAxisID: 'y2'
                  }
                ]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                scales: {
                  y1: {
                    type: 'linear',
                    position: 'left',
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Constructions neuves'
                    }
                  },
                  y2: {
                    type: 'linear',
                    position: 'right',
                    title: {
                      display: true,
                      text: "Évolution du nombre d'habitant"
                    },
                    grid: {
                      drawOnChartArea: false,
                    }
                  }
                },
                plugins: {
                  legend: {
                    display: true,
                    position: 'top'
                  }
                }
              }
            })
          </script>
        </body>
      </html>
    `
  }
}
