import cp from 'child_process';
import https from 'https';
import util from 'util';

import chalk from 'chalk';

export function normalize(string: string) {
  if (!string) return string;
  const expr = new RegExp(/"/gm);

  return string.trim().replace(expr, '\\"');
}

export function throwError(error?: string, code = 1) {
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
