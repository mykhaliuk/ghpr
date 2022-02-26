import { cleanExit } from './cleanExit';
import { tempLine } from './tempLine';
import { throwError } from './throwError';

const { MultiSelect } = require('enquirer');

export const getCollabs = async (
  collabsPromise: Promise<void | { data: Array<{ login: string }> }>,
) => {
  const deleteLastLine = tempLine('looking for reviewers...');

  const res = await collabsPromise;
  if (typeof res === 'undefined') return throwError("Can't fetch collabs");

  const { data } = res;

  deleteLastLine();

  const collabs = [];

  for (const { login } of data) collabs.push(login);

  const prompt = new MultiSelect({
    message: '👮\tReviewers',
    limit: 10,
    choices: collabs,
    pointer: '❯ ',
  });

  const choice = await prompt.run().catch(cleanExit);

  return choice?.join(',');
};
