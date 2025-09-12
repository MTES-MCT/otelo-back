import { Injectable } from '@nestjs/common'
import * as puppeteer from 'puppeteer'

interface ChartConfig {
  type: 'line' | 'bar' | 'pie'
  data: Record<string, unknown>[]
  width?: number
  height?: number
  xKey?: string
  valueKey?: string
  colors?: string[]
  lines?: Array<{
    dataKey: string
    color?: string
    strokeWidth?: number
    name?: string
  }>
  bars?: Array<{
    dataKey: string
    color?: string
    name?: string
  }>
}

@Injectable()
export class ChartGenerationService {
  async generateChartImage(chartConfig: ChartConfig): Promise<Buffer> {
    console.log(JSON.stringify(chartConfig, null, 2))
    const browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()

    const width = chartConfig.width || 800
    const height = chartConfig.height || 500

    await page.setViewport({ width, height })

    const html = this.generateRechartsHTML(chartConfig, width, height)

    await page.setContent(html)

    const screenshot = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width, height },
      omitBackground: false,
    })
    await browser.close()
    return Buffer.from(screenshot)
  }

  private generateRechartsHTML(chartConfig: ChartConfig, width: number, height: number): string {
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
                  width: 800px;
                  height: 500px;
                  overflow: hidden;
              }

              #myChart {
                  width: 800px;
                  height: 500px;
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

              const demographicData = [
                  { year: 2018, central: 106588, haute: 106612, basse: 106565 },
                  { year: 2019, central: 106916, haute: 106934, basse: 106900 },
                  { year: 2020, central: 107227, haute: 107235, basse: 107217 },
                  { year: 2021, central: 107491, haute: 107491, basse: 107491 },
                  { year: 2022, central: 107742, haute: 107815, basse: 107661 },
                  { year: 2023, central: 108038, haute: 108198, basse: 107862 },
                  { year: 2024, central: 108328, haute: 108586, basse: 108053 },
                  { year: 2025, central: 108583, haute: 108977, basse: 108183 },
                  { year: 2026, central: 108807, haute: 109355, basse: 108284 },
                  { year: 2027, central: 109015, haute: 109739, basse: 108324 },
                  { year: 2028, central: 109225, haute: 110129, basse: 108346 },
                  { year: 2029, central: 109408, haute: 110528, basse: 108314 },
                  { year: 2030, central: 109555, haute: 110911, basse: 108237 },
                  { year: 2031, central: 109685, haute: 111300, basse: 108110 },
                  { year: 2032, central: 109803, haute: 111686, basse: 107960 },
                  { year: 2033, central: 109905, haute: 112055, basse: 107792 },
                  { year: 2034, central: 109964, haute: 112391, basse: 107582 },
                  { year: 2035, central: 110006, haute: 112711, basse: 107332 },
                  { year: 2036, central: 110023, haute: 113026, basse: 107062 },
                  { year: 2037, central: 110022, haute: 113318, basse: 106765 },
                  { year: 2038, central: 109991, haute: 113595, basse: 106432 },
                  { year: 2039, central: 109956, haute: 113855, basse: 106088 },
                  { year: 2040, central: 109875, haute: 114096, basse: 105712 },
                  { year: 2041, central: 109797, haute: 114328, basse: 105321 },
                  { year: 2042, central: 109703, haute: 114535, basse: 104922 },
                  { year: 2043, central: 109600, haute: 114742, basse: 104488 },
                  { year: 2044, central: 109465, haute: 114927, basse: 104045 },
                  { year: 2045, central: 109327, haute: 115092, basse: 103604 },
                  { year: 2046, central: 109168, haute: 115260, basse: 103147 },
                  { year: 2047, central: 109011, haute: 115393, basse: 102665 },
                  { year: 2048, central: 108839, haute: 115538, basse: 102187 },
                  { year: 2049, central: 108664, haute: 115650, basse: 101704 },
                  { year: 2050, central: 108460, haute: 115766, basse: 101191 }
              ];

              new Chart(ctx, {
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
                      scales: {
                          x: {
                              title: {
                                  display: true,
                                  text: 'Year'
                              }
                          },
                          y: {
                              title: {
                                  display: true,
                                  text: 'Population'
                              },
                              beginAtZero: false
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

  // private generateRechartsJavaScript(chartConfig: ChartConfig): string {
  //   return `
  //     const {
  //       LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer
  //     } = Recharts;

  //     const data = ${JSON.stringify(chartConfig.data)};
  //     const colors = ['#666666', '#000091', '#161616'];

  //     const chartElement = React.createElement(LineChart, {
  //       data: data,
  //       margin: { top: 20, right: 30, left: 20, bottom: 20 }
  //     }, [
  //       React.createElement(CartesianGrid, { key: 'grid', strokeDasharray: '3 3' }),
  //       React.createElement(XAxis, {
  //         key: 'xaxis',
  //         dataKey: 'year',
  //         fontSize: 12
  //       }),
  //       React.createElement(YAxis, {
  //         key: 'yaxis',
  //         fontSize: 12
  //       }),
  //       React.createElement(Line, {
  //         key: 'haute',
  //         type: 'monotone',
  //         dataKey: 'haute',
  //         stroke: colors[0],
  //         strokeWidth: 1,
  //         name: 'Haute'
  //       }),
  //       React.createElement(Line, {
  //         key: 'central',
  //         type: 'monotone',
  //         dataKey: 'central',
  //         stroke: colors[1],
  //         strokeWidth: 2,
  //         name: 'Central'
  //       }),
  //       React.createElement(Line, {
  //         key: 'basse',
  //         type: 'monotone',
  //         dataKey: 'basse',
  //         stroke: colors[2],
  //         strokeWidth: 1,
  //         name: 'Basse'
  //       })
  //     ]);

  //     const chart = React.createElement(ResponsiveContainer,
  //       { width: '100%', height: '100%' },
  //       chartElement
  //     );

  //     ReactDOM.render(chart, document.getElementById('recharts-chart'));
  //   `
  // }

  // private generateLinesJavaScript(lines: ChartConfig['lines'] = []): string {
  //   return (lines || [])
  //     .map(
  //       (line) => `
  //     React.createElement(Line, {
  //       key: '${line.dataKey}',
  //       type: 'monotone',
  //       dataKey: '${line.dataKey}',
  //       stroke: '${line.color || '#8884d8'}',
  //       strokeWidth: ${line.strokeWidth || 2},
  //       name: '${line.name || line.dataKey}'
  //     })
  //   `,
  //     )
  //     .join(',')
  // }

  // private generateBarsJavaScript(bars: ChartConfig['bars'] = []): string {
  //   return (bars || [])
  //     .map(
  //       (bar) => `
  //     React.createElement(Bar, {
  //       key: '${bar.dataKey}',
  //       dataKey: '${bar.dataKey}',
  //       fill: '${bar.color || '#8884d8'}',
  //       name: '${bar.name || bar.dataKey}'
  //     })
  //   `,
  //     )
  //     .join(',')
  // }
}
