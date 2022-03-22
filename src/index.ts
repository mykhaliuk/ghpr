import { createAPIClient } from './lib/api'
import { PRBuilder } from './lib/PRBuilder'

module.exports = (async function () {
  console.clear()
  const client = await createAPIClient()
  const builder = new PRBuilder(client)

  await builder.run()
})()
