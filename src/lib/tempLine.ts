import chalk from 'chalk';

/**
 * @param {string} message
 * @returns {() => void} clean function that removes las line in stdout
 */
export const tempLine = (message: string): (() => void) => {
  process.stdout.write(chalk.italic.gray(message));

  return function () {
    process.stdout.write('\r\x1b[K');
  };
};
