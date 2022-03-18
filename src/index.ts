import { Api } from './lib/api';
import { createPR } from './lib/createPR';
import { exitIfNothing2Commit } from './lib/exitIfNothing2Commit';
import { getCollabs } from './lib/getCollabs';
import { getCommits } from './lib/getCommits';
import { getFirstCommit } from './lib/getFirstCommit';
import { getLabels } from './lib/getLabels';
import { ifDraft } from './lib/ifDraft';

import { init } from './lib/init';
import { setBranches } from './lib/setBranches';
import { setIssue } from './lib/setIssue';
import { throwError } from './lib/throwError';

module.exports = (async function () {
  console.clear();

  const { EHKey, ...config } = await init();
  const api = new Api(config);

  const base = await setBranches();
  const firstCommit = await getFirstCommit(base);

  exitIfNothing2Commit(firstCommit);

  const collabsReq = api
    .getCollabs()
    .catch(() => throwError('Error fetch collaborators'));

  const labelsReq = api
    .getLabels()
    .catch(() => throwError('Error fetch collaborators'));

  const commits = await getCommits(base);
  const issue = await setIssue(EHKey);
  const reviewers = await getCollabs(collabsReq, config.login);
  const draft = await ifDraft();
  const labels = await getLabels(labelsReq);

  await createPR({
    me: config.login,
    base,
    commits,
    draft,
    firstCommit,
    issue,
    labels,
    reviewers,
  });

  return process.exit();
})();
