import cp from 'child_process'
import util from 'util'

import chalk from 'chalk'

export function throwError(error?: string, code = 1) {
  if (error) {
    console.clear()
    console.log(error)
    process.exit(code)
  }
}

export const deleteLastLine = () => process.stdout.write('\r\x1b[K')

export const tempLine = (message: string): (() => void) => {
  process.stdout.write(chalk.italic.gray(`${message}`))

  return deleteLastLine
}

export const line = (message: string) => {
  process.stdout.write(chalk.italic.gray(`${message}\n`))
}

const _exec = util.promisify(cp.exec)

export const exec = async (command: string): Promise<string> => {
  const { stdout, stderr } = await _exec(command)

  if (stderr) throw new Error(stderr)

  return stdout
}
