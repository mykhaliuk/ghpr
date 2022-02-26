import chalk from 'chalk';
import { existsSync, readFileSync, writeFile } from 'fs';
import { join } from 'path';
import { exec } from './promisifiedExec';
import { tempLine } from './tempLine';
import { throwError } from './throwError';

const { Form } = require('enquirer');

const repoPromise = exec('git config --get remote.origin.url');

export const init = async () => {
  const deleteLastLine = tempLine('Initializing...');

  const { stdout: repoData, stderr } = await repoPromise;

  throwError(stderr);
  if (!repoData) throwError('No git repo found');

  const { repo, owner } = parseRepoData(repoData);

  const { GITHUB_TOKEN, GH_TOKEN } = process.env;
  const configName = '.ghprrc';
  const homedir = require('os').homedir();
  const configPath = join(homedir, configName);

  let token = GITHUB_TOKEN || GH_TOKEN;
  if (!token) {
    throwError(
      chalk.red.bold(
        'Error: GitHub token must be set: https://docs.github.com/en/actions/security-guides/automatic-token-authentication',
      ),
    );
  }

  /** return config if config file is exist */

  if (existsSync(configPath)) {
    try {
      const configData = readFileSync(configPath);
      // @ts-ignore - because JSON.parse handles raw data
      const { login, EHKey } = JSON.parse(configData);

      deleteLastLine();

      return { token: token!, EHKey, login: login as string, repo, owner };
    } catch (err) {
      throwError('Unable parse config file');
    }
  }

  /** otherwise create a config file*/

  const prompt = new Form({
    name: 'user',
    message: 'Your GitHub login please:',
    choices: [
      {
        name: 'login',
        message: 'GitHub login',
        initial: '',
      },
      { name: 'EHKey', message: 'EverHour token', initial: '' },
    ],
    validate(values: any) {
      if (!values.login)
        return prompt.styles.danger("I can't leave w/out login 🥺");
      return true;
    },
  });

  const config = await prompt.run();

  const configData = JSON.stringify(config);

  writeFile(configPath, configData, throwError);

  deleteLastLine();
  process.stdout.write(chalk.magentaBright('Config saved to ~/.ghprrc'));

  return { ...config, token: token!, repo, owner };
};

function parseRepoData(data: string) {
  // git@github.com:mykhaliuk/ghpr.git
  const { 1: or } = data.split(':');
  // mykhaliuk/ghpr.git
  const { 0: owner, 1: repoGit } = or.split('/');
  // ghpr.git
  const repo = repoGit.slice(0, -5);
  // ghpr
  return { repo, owner };
}
