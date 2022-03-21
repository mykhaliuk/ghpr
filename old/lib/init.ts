import { existsSync, readFileSync, writeFile } from 'fs'
import { join } from 'path'

import chalk from 'chalk'
import { prompt } from 'inquirer'

import { exec } from './promisifiedExec'
import { tempLine } from './tempLine'
import { throwError } from './throwError'

export const init = async (): Promise<APIConfig> => {
  const deleteLastLine = tempLine('Initializing...')
  const { stdout: repoData, stderr } = await exec(
    'git config --get remote.origin.url',
  )

  throwError(stderr)
  if (!repoData) throwError('No git repo found')

  const { repo, owner } = parseRepoData(repoData)

  const { GITHUB_TOKEN, GH_TOKEN } = process.env
  const configName = '.ghprrc'
  const homedir = require('os').homedir()
  const configPath = join(homedir, configName)

  let token = GITHUB_TOKEN || GH_TOKEN
  if (!token) {
    throwError(
      chalk.red.bold(
        'Error: GitHub token must be set: https://docs.github.com/en/actions/security-guides/automatic-token-authentication',
      ),
    )
  }

  /** return config if config file is exist */

  if (existsSync(configPath)) {
    try {
      const configData = readFileSync(configPath)
      // @ts-ignore - because JSON.parse handles raw data
      const { login, EHKey } = JSON.parse(configData)

      deleteLastLine()

      return { token: token!, EHKey, login: login as string, repo, owner }
    } catch (err) {
      throwError('Unable parse config file')
    }
  }

  type PromptConfig = {
    login: string
  }

  /** otherwise create a config file*/
  const config = await prompt<PromptConfig>([
    {
      name: 'login',
      message: 'Enter your GitHub login please:',
      type: 'input',
      validate(login: any) {
        if (!login) return chalk.red.bold("I can't leave w/out login 🥺")

        return true
      },
    },
  ])

  const configData = JSON.stringify(config)

  writeFile(configPath, configData, throwError)

  deleteLastLine()
  process.stdout.write(chalk.magentaBright('Config saved to ~/.ghprrc'))

  return { ...config, token: token!, repo, owner }
}

function parseRepoData(data: string) {
  // git@github.com:mykhaliuk/ghpr.git
  const { 1: or } = data.split(':')
  // mykhaliuk/ghpr.git
  const { 0: owner, 1: repoGit } = or.split('/')
  // ghpr.git
  const repo = repoGit.slice(0, -5)
  // ghpr
  return { repo, owner }
}
