import { Toggle } from 'inquirer';

import { cleanExit } from './cleanExit';

export const ifDraft = async () => {
  const prompt = new Toggle({
    message: '📑\tDraft?',
    enabled: 'Yep',
    disabled: 'Nope',
    initial: false,
  });

  const res = await prompt.run().catch(cleanExit);
  return res ? '-d' : '';
};
