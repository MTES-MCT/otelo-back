/* eslint-disable @typescript-eslint/no-require-imports */
const data = require('./r32.json')
const schema = 'otelo_bassin'

const bassinSql = `INSERT INTO ${schema}.bassin(name) VALUES ('$$BASSIN_NAME$$');`
const epcisSql = `UPDATE ${schema}.epcis SET bassin_name='$$BASSIN_NAME$$' WHERE code = '$$EPCI_CODE$$'`

const main = () => {
  const results = data.features.map((prop) => {
    const bassinName = prop.properties.lib_zo.replace("'", '"').replace(',', '')
    const inlineEpcis = prop.properties.epcis
      .map((epci) => epcisSql.replace('$$BASSIN_NAME$$', bassinName).replace('$$EPCI_CODE$$', epci.code_epci))
      .join(';')
    return `${bassinSql.replace('$$BASSIN_NAME$$', bassinName)}${inlineEpcis}`
  })
  console.log(results.join(';'))
}

main()
