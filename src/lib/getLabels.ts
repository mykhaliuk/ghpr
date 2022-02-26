import chalk from 'chalk';
import { cleanExit } from './cleanExit';
import { tempLine } from './tempLine';
import { throwError } from './throwError';

const { MultiSelect } = require('enquirer');

export const getLabels = async (
  labelsPromise: Promise<void | {
    data: Array<{ name: string; color: string }>;
  }>,
) => {
  const deleteLastLine = tempLine('looking for labels...');

  const labels = [];

  const res = await labelsPromise;
  if (typeof res === 'undefined') return throwError("Can't fetch labels");

  const { data } = res;
  for (const { name, color } of data)
    labels.push({ message: chalk.hex(`#${color}`)(name), name });

  const prompt = new MultiSelect({
    name: 'labels',
    message: '🏷 \tlabels',
    limit: 10,
    choices: labels,
  });

  deleteLastLine();

  return prompt.run().catch(cleanExit);
};
