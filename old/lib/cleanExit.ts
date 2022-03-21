import chalk from 'chalk';

export const cleanExit = () => {
  const message = chalk.green.bold('See ya 👋');

  process.stdout.write(message);
  process.exit();
};
