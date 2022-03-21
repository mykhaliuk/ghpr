import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

import chalk from 'chalk'
import { Question, prompt } from 'inquirer'

import { exec, line } from '../utils'
import { APIClient } from './client'
import { APIConfig, TrackerApp, TrackerInfo } from './interfaces'

type PromptAPIConfig = {
  login: string
  token?: string
  trackerName: TrackerApp
}

type StoredAPIConfig = Omit<APIConfig, 'repo' | 'owner'>

type RepoInfo = {
  repo: string
  owner: string
}

async function parseRepoData(): Promise<RepoInfo> {
  const data = await exec('git config --get remote.origin.url')

  // git@github.com:mykhaliuk/ghpr.git
  const { 1: or } = data.split(':')
  // mykhaliuk/ghpr.git
  const { 0: owner, 1: repoGit } = or.split('/')
  // ghpr.git
  const repo = repoGit.slice(0, -5)
  // ghpr
  return { repo, owner }
}

export async function getAPIConfig(): Promise<APIConfig> {
  const configName = '.ghprrc'
  const homedir = require('os').homedir()

  const configPath = join(homedir, configName)
  const { repo, owner } = await parseRepoData()

  if (existsSync(configPath)) {
    try {
      const configData = readFileSync(configPath)

      const config = JSON.parse(configData.toString()) as StoredAPIConfig

      return { ...config, repo, owner }
    } catch (err) {
      throw new Error('Unable to parse config file')
    }
  }

  line('Initializing...')

  const { GITHUB_TOKEN, GH_TOKEN } = process.env
  const ghtoken = GITHUB_TOKEN || GH_TOKEN || ''

  const prompts: Question[] = []

  if (!ghtoken) {
    prompts.push({
      name: 'token',
      prefix: '🐙',
      message: 'Enter your GitHub TOKEN please:',
      type: 'input',
      validate(login: any) {
        if (!login) return chalk.red.bold("I can't leave w/out Github Token 🥺")

        return true
      },
    })
  }

  prompts.push({
    name: 'login',
    prefix: '🤓',
    message: 'Enter your GitHub LOGIN please:',
    type: 'input',
    validate(login: any) {
      if (!login) return chalk.red.bold("I can't leave w/out login 🥺")

      return true
    },
  })

  prompts.push({
    name: 'trackerName',
    message: 'Use a tracker ?',
    prefix: '⏰',
    type: 'list',
    choices: [
      { name: 'everhour', value: 'everhour' },
      { name: 'toggl', value: 'toggl' },
      { name: 'no thanks', value: '' },
    ],
  } as any)

  const {
    login,
    token = ghtoken,
    trackerName,
  } = await prompt<PromptAPIConfig>(prompts)

  let tracker: TrackerInfo | undefined = undefined
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
            )

          return true
        },
      },
    ])

    tracker = {
      app: trackerName,
      token: trackerToken,
    }
  }

  const config: StoredAPIConfig = {
    token,
    login,
    tracker,
  }
  const configData = JSON.stringify(config)

  writeFileSync(configPath, configData)
  process.stdout.write(chalk.magentaBright('\nConfig saved to ~/.ghprrc\n'))

  const { confirm } = await prompt({
    name: 'confirm',
    type: 'confirm',
    message: 'Continue creating your Pull Request ?',
  })

  if (!confirm) {
    process.exit(0)
  }

  return { ...config, repo, owner }
}

export async function createAPIClient() {
  const config = await getAPIConfig()

  return new APIClient(config)
}
