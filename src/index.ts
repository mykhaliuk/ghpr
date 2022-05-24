import { createAPIClient } from './lib/api';
import { PRBuilder } from './lib/PRBuilder';
import { returnVersion } from './lib/utils';

module.exports = (async function () {
  returnVersion();

  console.clear();
  const api = await createAPIClient();
  const builder = new PRBuilder(api);

  const info = await builder.run();
  await api.publishPR(info);
})();

export { getAPIConfig } from './lib/utils';
export { saveConfig } from './lib/utils';
export { getConfigPath } from './lib/utils';
