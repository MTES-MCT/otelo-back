const data = require('./r94.json')
const schema = 'public'

const bassinSql = `INSERT INTO ${schema}.bassin(name) SELECT '$$BASSIN_NAME$$' WHERE NOT EXISTS (SELECT 1 FROM ${schema}.bassin WHERE name = '$$BASSIN_NAME$$');`

const epcisSql = `UPDATE ${schema}.epcis SET bassin_name='$$BASSIN_NAME$$' WHERE code = '$$EPCI_CODE$$'`

const main = () => {
  const results = data.features.map((prop) => {
    const bassinName = prop.properties.lib_zo.replace("'", '"').replace(',', '')
    const inlineEpcis = prop.properties.epcis
      .map((epci) => epcisSql.replace(/\$\$BASSIN_NAME\$\$/g, bassinName).replace('$$EPCI_CODE$$', epci.code_epci))
      .join(';')
    return `${bassinSql.replace(/\$\$BASSIN_NAME\$\$/g, bassinName)}${inlineEpcis}`
  })
  console.log(results.join(';'))
}

main()
