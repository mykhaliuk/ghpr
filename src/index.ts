import { createAPIClient } from './lib/api';
import { PRBuilder } from './lib/PRBuilder';

module.exports = async function () {
  console.clear();
  const api = await createAPIClient();
  const builder = new PRBuilder(api);

  const info = await builder.run();
  await api.publishPR(info);
};
export { getAPIConfig } from './lib/utils';
export { saveConfig } from './lib/utils';
export { getConfigPath } from './lib/utils';
