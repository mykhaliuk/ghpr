import chalk from 'chalk';
import { exec } from './promisifiedExec';
import { tempLine } from './tempLine';
import { throwError } from './throwError';

const icon = chalk.green('✔');

export const setIssue = async (apiKey: string) => {
  const deleteLastLine = tempLine('looking for issue...');

  const { stdout, stderr } = await exec(
    `curl -s --request GET \
        --url https://api.everhour.com/timers/current \
        --header 'Content-Type: application/json' \
        --header 'X-Api-Key: ${apiKey}'`,
  );

  throwError(stderr);

  deleteLastLine();

  const { task } = JSON.parse(stdout);

  const issue = { name: task?.name ?? 'not found', url: task?.url };

  process.stdout.write(
    `${icon} ⏰\t${chalk.bold('Issue')} ${chalk.dim('·')} ${issue.name}\n`,
  );

  return issue;
};
