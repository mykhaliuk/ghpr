import cp from 'child_process';
import { tempLine } from './tempLine';

type Issue = {
  name: string;
  url: string;
};

type PRParams = {
  base: string;
  commits: string;
  draft: string;
  firstCommit: string;
  issue: Issue;
  labels: string;
  me: string;
  reviewers: string;
};

export const createPR = async (params: PRParams) => {
  const { me, base, commits, draft, firstCommit, issue, labels, reviewers } =
    params;

  tempLine('Creating pull request...');

  let body = `${firstCommit}\n\n`;
  body += `**Related to issue:** [${issue.name}](${issue.url})\n\n`;
  body += `## Changelog:\n\n`;
  body += `${commits}\n\n`;

  const command = `hub pull-request ${draft} -p -f -a ${me} -r "${reviewers}" -l "${labels}" -b "${base}" -m "${body}" --edit`;

  const childProcess = cp.spawn(command, { shell: true });

  process.stdin.pipe(childProcess.stdin);
  let progressStringRemoved = false;

  for await (const data of childProcess.stdout) {
    if (!progressStringRemoved) {
      process.stdout.write('\r\x1b[K');
      progressStringRemoved = true;
    }
    process.stdout.write(data);
  }

  for await (const error of childProcess.stderr) {
    process.stdout.write(error);
  }
};
