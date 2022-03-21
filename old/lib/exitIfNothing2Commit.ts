import chalk from 'chalk';

export function exitIfNothing2Commit(commit: any) {
  if (!commit) {
    console.clear();
    console.log(chalk.gray.bold.italic('Make a couple commits before 😜'));
    process.exit(0);
  }
}
