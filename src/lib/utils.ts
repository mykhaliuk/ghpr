import chalk from 'chalk';
import cp from 'child_process';
import https from 'https';
import util from 'util';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { prompt, Question } from 'inquirer';

import { APIConfig, TrackerAppName, TrackerInfo } from './api';
import { SerializedRecent } from './api/recent/interface';
import { parseRecent } from './api/recent';

export function stopApp(error?: string, code = 1) {
  if (error) {
    console.clear();
    console.log(error);
    process.exit(code);
  }
}

export const deleteLastLine = () => process.stdout.write('\r\x1b[K');

export const tempLine = (message: string): (() => void) => {
  process.stdout.write(chalk.italic.gray(`${message}`));

  return deleteLastLine;
};

type UnPromisify<T> = T extends Promise<infer E> ? E : T;

export async function withTempLine<Fn extends () => any>(
  line: string,
  cb: Fn,
): Promise<UnPromisify<ReturnType<Fn>>> {
  tempLine(line);
  const result = await cb();
  deleteLastLine();
  return result;
}

export const line = (message: string) => {
  process.stdout.write(chalk.italic.gray(`${message}\n`));
};

const _exec = util.promisify(cp.exec);

export const exec = async (command: string): Promise<string> => {
  const { stdout, stderr } = await _exec(command);

  if (stderr) throw new Error(stderr);

  return stdout;
};

export const spawn = async (
  command: string,
  onData: (data: string) => void,
  env: {} = {},
): Promise<void> => {
  const childProcess = cp.spawn(command, {
    shell: true,
    env: {
      ...process.env,
      ...env,
    },
  });
  process.stdin.pipe(childProcess.stdin);

  for await (const data of childProcess.stdout) {
    onData(data);
  }

  for await (const data of childProcess.stderr) {
    onData(data);
  }
};

export type HttpsResponse<T = any> = {
  data: T;
  response: {
    statusCode?: number;
    statusMessage?: string;
    headers?: Record<string, any>;
  };
};

export const request = async <T = any>(
  options: https.RequestOptions,
): Promise<HttpsResponse<T>> => {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      const chunks: any[] = [];
      res.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      req.on('close', () => {
        const dataStr = Buffer.concat(chunks).toString();
        const data = JSON.parse(dataStr || '{}') as T;

        resolve({
          data,
          response: {
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            headers: res.headers,
          },
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write('');
  });
};

type PromptAPIConfig = {
  login: string;
  token?: string;
  trackerName: TrackerAppName;
};

type StoredAPIConfig = Omit<APIConfig, 'repo' | 'owner' | 'recents'> & {
  recents: {
    branches: SerializedRecent[];
    reviewers: SerializedRecent[];
    labels: SerializedRecent[];
  };
};

type RepoInfo = {
  repo: string;
  owner: string;
};

async function parseRepoData(): Promise<RepoInfo> {
  const data = await exec('git config --get remote.origin.url');

  // git@github.com:mykhaliuk/ghpr.git
  const { 1: or } = data.split(':');

  // mykhaliuk/ghpr.git
  const { 0: owner, 1: repoGit } = or.split('/');
  // ghpr.git
  const repo = repoGit.slice(0, -5);
  // ghpr
  return { repo, owner };
}

export function getConfigPath() {
  const configName = '.ghprrc';
  const homedir = require('os').homedir();

  return join(homedir, configName);
}

export function saveConfig(config: APIConfig) {
  const path = getConfigPath();
  const configData = JSON.stringify(config);

  writeFileSync(path, configData);
}

export async function getAPIConfig(): Promise<APIConfig> {
  const configPath = getConfigPath();
  const { repo, owner } = await parseRepoData();

  if (existsSync(configPath)) {
    try {
      const configData = readFileSync(configPath);

      const config = JSON.parse(configData.toString()) as StoredAPIConfig;

      return {
        ...config,
        repo,
        owner,
        recents: {
          branches: parseRecent(config.recents?.branches || []),
          reviewers: parseRecent(config.recents?.reviewers || []),
          labels: parseRecent(config.recents?.labels || []),
        },
      };
    } catch (err) {
      stopApp('Unable to parse config file');
    }
  }

  line('Initializing...');

  const { GITHUB_TOKEN, GH_TOKEN } = process.env;
  const ghtoken = GITHUB_TOKEN || GH_TOKEN || '';

  const prompts: Question[] = [];

  if (!ghtoken) {
    prompts.push({
      name: 'token',
      prefix: '🐙',
      message: 'Enter your GitHub TOKEN please:',
      type: 'input',
      validate(login: any) {
        if (!login)
          return chalk.red.bold("I can't leave w/out Github Token 🥺");

        return true;
      },
    });
  }

  prompts.push({
    name: 'login',
    prefix: '🤓',
    message: 'Enter your GitHub LOGIN please:',
    type: 'input',
    validate(login: any) {
      if (!login) return chalk.red.bold("I can't leave w/out login 🥺");

      return true;
    },
  });

  prompts.push({
    name: 'trackerName',
    message: 'Use a tracker ?',
    prefix: '⏰',
    type: 'list',
    choices: [
      { name: 'everhour', value: 'everhour' },
      // { name: 'toggl', value: 'toggl' },
      { name: 'no thanks', value: '' },
    ],
  } as any);

  const {
    login,
    token = ghtoken,
    trackerName,
  } = await prompt<PromptAPIConfig>(prompts);

  let tracker: TrackerInfo | undefined = undefined;
  if (trackerName) {
    const { trackerToken } = await prompt([
      {
        name: 'trackerToken',
        message: `Enter your ${trackerName} token please:`,
        type: 'input',
        prefix: '⏰',
        validate(trackerToken: any) {
          if (!trackerToken)
            return chalk.red.bold(
              "I can't leave w/out providing a token for the time tracker 🥺",
            );

          return true;
        },
      },
    ]);

    tracker = {
      app: trackerName,
      token: trackerToken,
    };
  }

  const config: StoredAPIConfig = {
    token,
    login,
    tracker,
    recents: {
      branches: [],
      reviewers: [],
      labels: [],
    },
  };
  const configData = JSON.stringify(config);

  writeFileSync(configPath, configData);
  process.stdout.write(chalk.magentaBright('\nConfig saved to ~/.ghprrc\n'));

  const { confirm } = await prompt({
    name: 'confirm',
    type: 'confirm',
    message: 'Continue creating your Pull Request ?',
  });

  if (!confirm) {
    process.exit(0);
  }

  return {
    ...config,
    repo,
    owner,
    recents: {
      branches: [],
      reviewers: [],
      labels: [],
    },
  };
}

export function returnVersion() {
  if (!process.argv[2]?.includes?.('-v')) return;

  const filePath = join(
    __dirname.split('/').slice(0, -1).join('/'),
    'package.json',
  );
  const raw = readFileSync(filePath);
  const { version } = JSON.parse(raw.toString());

  stopApp(`Version: ${version}`, 0);
}
