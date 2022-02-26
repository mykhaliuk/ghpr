import { cleanExit } from './cleanExit';

const { Toggle } = require('enquirer');

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
