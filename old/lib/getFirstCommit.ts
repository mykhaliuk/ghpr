import { exec } from './promisifiedExec';
import { throwError } from './throwError';

export const getFirstCommit = async (base: string) => {
  const { stdout, stderr } = await exec(
    `git cherry ${base} -v | head -n 1 | sed -E "s/(\\+|-) [^ ]+ //"`,
  );
  throwError(stderr);

  return stdout;
};
