import { Select } from 'inquirer';

import { cleanExit } from './cleanExit';
import { exec } from './promisifiedExec';
import { tempLine } from './tempLine';
import { throwError } from './throwError';

const branchesPromise = exec(
  `git branch -l | grep -v "*" | grep -v "/" | sed -E "s/^ +//"`,
);

export const setBranches = async () => {
  const deleteLastLine = tempLine('getting branches...');
  const { stdout, stderr } = await branchesPromise;

  throwError(stderr);

  const branches = (stdout || 'main').split('\n').filter(Boolean);

  const prompt = new Select({
    message: '🌿\tBase branch',
    choices: branches,
    initial: 'main',
  });

  deleteLastLine();

  return prompt.run().catch(cleanExit);
};
