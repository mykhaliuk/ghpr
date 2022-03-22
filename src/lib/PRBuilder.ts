import chalk from 'chalk'
import { prompt } from 'inquirer'

import { Issue } from './api'
import { APIClient } from './api/client'
import { withTempLine } from './utils'

export interface PRInfo {
  branch: string
}

export class PRBuilder {
  private branch: string | undefined
  private issue: Issue | null = null

  constructor(private api: APIClient) {}

  private write(icon: string, title: string, data: string) {
    process.stdout.write(`${icon} ${chalk.bold(`${title}:`)} ${data}\n`)
  }

  async run(): Promise<void> {
    this.issue = await withTempLine('Search current issue...', async () =>
      this.api.getTrackerIssue(),
    )

    this.write('⏰', 'Issue', this.issue?.name || 'No Issue Selected')

    const branches = await this.api.getBranches()

    const { branch } = await prompt([
      {
        name: 'Branch',
        prefix: '🌿',
        type: 'list',
        choices: branches,
        validate: (value) => {
          if (!value) return 'Please select a branch'
        },
      },
    ])

    this.branch = branch

    console.log(this.issue)
  }

  build() {
    if (!this.branch) throw new Error('missing branch value')

    return {
      branch: this.branch,
    }
  }
}
