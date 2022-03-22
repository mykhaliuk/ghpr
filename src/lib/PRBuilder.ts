import chalk from 'chalk'
import { prompt } from 'inquirer'
import autocomplete from 'inquirer-autocomplete-prompt'

import { Issue } from './api'
import { APIClient } from './api/client'
import { withTempLine } from './utils'

prompt.registerPrompt('autocomplete', autocomplete)

export interface PRInfo {
  branch: string
}

export class PRBuilder {
  private branch: string | undefined
  private issue: Issue | null = null
  private reviewers: string[] = []

  constructor(private api: APIClient) {}

  private write(icon: string, title: string, data: string) {
    process.stdout.write(`${icon} ${chalk.bold(`${title}:`)} ${data}\n`)
  }

  private writeIssue() {
    this.write('⏰', 'Issue', this.issue?.name || 'No Issue Selected')
  }

  private writeBranch() {
    this.write('🌿', 'Branch', this.branch || '')
  }

  private writeReviewers() {
    this.write('🤓', 'Reviewer', this.reviewers.join(', '))
  }

  async run(): Promise<void> {
    this.issue = await withTempLine('Search current issue...', async () =>
      this.api.getTrackerIssue(),
    )

    this.writeIssue()

    const branches = await this.api.getBranches()

    const { branch } = await prompt([
      {
        name: 'branch',
        message: 'Branch',
        prefix: '🌿',
        type: 'list',
        choices: branches,
        validate: (value) => {
          if (!value) return 'Please select a branch'
        },
      },
    ])

    this.branch = branch

    let collabs = await withTempLine('Search for collabs', () =>
      this.api.getCollabs(),
    )

    const stopUser = '--stop--'
    collabs.unshift({
      login: stopUser,
    } as any)

    collabs.push({
      login: 'world',
    } as any)

    collabs.push({
      login: 'top',
    } as any)

    collabs.push({
      login: 'virginie',
    } as any)

    this.writeReviewers()
    while (true) {
      const { reviewer } = await prompt([
        {
          name: 'reviewer',
          message: '',
          prefix: '',
          type: 'autocomplete',
          source: (_: string, input: string) =>
            Promise.resolve(
              collabs.flatMap((collab) => {
                if (!input) return [collab.login]
                const regexp = new RegExp(`${input.toLowerCase()}.*`)
                return regexp.test(collab.login.toLowerCase())
                  ? [collab.login]
                  : []
              }),
            ),
        },
      ])

      if (reviewer === stopUser) break

      collabs = collabs.filter((c) => c.login !== reviewer)
      this.reviewers.push(reviewer)
    }

    console.clear()

    this.writeIssue()
    this.writeBranch()
    this.writeReviewers()
  }

  build() {
    if (!this.branch) throw new Error('missing branch value')

    return {
      branch: this.branch,
    }
  }
}
