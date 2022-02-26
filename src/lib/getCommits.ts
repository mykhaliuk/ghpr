import { exec } from './promisifiedExec';
import { throwError } from './throwError';

export const getCommits = async (base: string) => {
  const { stdout, stderr } = await exec(
    `git cherry ${base} -v | sed -E "s/(\\+|-) [^ ]+ /- /"`,
  );

  throwError(stderr);

  return stdout;
};
