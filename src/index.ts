import { createAPIClient } from './lib/api'
import { PRBuilder } from './lib/PRBuilder'

module.exports = (async function () {
  console.clear()
  const client = await createAPIClient()
  const builder = new PRBuilder(client)

  const info = await builder.run()
  console.log(info)
})()
