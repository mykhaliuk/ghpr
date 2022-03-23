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
  private labels: string[] = []
  private draft: boolean = false
  private commit: string = ''

  constructor(private api: APIClient) {}

  private write(icon: string, title: string, data: string) {
    process.stdout.write(`${icon} ${chalk.bold(`${title}:`)} ${data}\n`)
  }

  private writeFirstCommit() {
    this.write('🚚', 'Title:', this.commit || '')
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
  private writeDraft() {
    this.write('📑', 'Draft', this.draft ? 'Yes' : 'No')
  }

  private writeLabels() {
    this.write('🏷 ', 'Labels', this.labels.join(', '))
  }

  private async promptBranch(): Promise<string> {
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

    return branch
  }

  private async promptReviewers(): Promise<string[]> {
    let collabs = await withTempLine('Search for collabs', () =>
      this.api.getCollabs(),
    )

    const stopUser = '--stop--'
    collabs.unshift({
      login: stopUser,
    } as any)

    this.writeReviewers()
    let reviewers: string[] = []
    while (true) {
      let { reviewer } = await prompt([
        {
          name: 'reviewer',
          message: '- ',
          prefix: '',
          type: 'autocomplete',
          source: (_: string, input: string) =>
            Promise.resolve(
              collabs.flatMap((collab, idx) => {
                let name = collab.login
                if (idx === 0 && input) return []
                if (idx > 0) {
                  name = `${idx}. ${collab.login}`
                }

                if (!input) return [name]
                const regexpLogin = new RegExp(`${input.toLowerCase()}.*`)
                const regexpNum = new RegExp(`${idx}.*`)
                return regexpLogin.test(collab.login.toLowerCase()) ||
                  regexpNum.test(input)
                  ? [name]
                  : []
              }),
            ),
        },
      ])

      if (reviewer === stopUser) break

      reviewer = reviewer.replace(/^\d+\. /, '')
      collabs = collabs.filter((c) => c.login !== reviewer)
      reviewers.push(reviewer)

      if (collabs.length === 1) break
    }

    return reviewers
  }

  private async promptLabels(): Promise<string[]> {
    let labels = await withTempLine('Search for labels', () =>
      this.api.getLabels(),
    )

    const stopUser = '--stop--'
    labels.unshift({
      name: stopUser,
    } as any)

    this.writeLabels()
    let selectedLabels: string[] = []
    while (true) {
      let { label } = await prompt([
        {
          name: 'label',
          message: '- ',
          prefix: '',
          type: 'autocomplete',
          source: (_: string, input: string) =>
            Promise.resolve(
              labels.flatMap((label, idx) => {
                let name = label.name
                if (idx === 0 && input) return []
                if (idx > 0) {
                  name = `${idx}. ${label.name}`
                }

                if (!input) return [name]
                const regexpLogin = new RegExp(`${input.toLowerCase()}.*`)
                const regexpNum = new RegExp(`${idx}.*`)
                return regexpLogin.test(label.name.toLowerCase()) ||
                  regexpNum.test(input)
                  ? [name]
                  : []
              }),
            ),
        },
      ])

      if (label === stopUser) break

      label = label.replace(/^\d+\. /, '')
      labels = labels.filter((c) => c.name !== label)
      selectedLabels.push(label)

      if (labels.length === 1) break
    }

    return selectedLabels
  }

  private async promptDraft(): Promise<boolean> {
    const { draft } = await prompt([
      {
        name: 'draft',
        message: 'Draft ?',
        prefix: '📑',
        type: 'confirm',
        default: false,
      },
    ])

    return draft
  }

  async run(): Promise<void> {
    this.issue = await withTempLine('Search current issue...', async () =>
      this.api.getTrackerIssue(),
    )

    this.writeIssue()
    this.branch = await this.promptBranch()
    this.commit = await withTempLine('Retrieve first commit', async () =>
      this.api.getFirstCommit(this.branch!),
    )

    this.writeFirstCommit()

    this.reviewers = await this.promptReviewers()

    console.clear()

    this.writeIssue()
    this.writeBranch()
    this.writeFirstCommit()
    this.writeReviewers()

    this.draft = await this.promptDraft()
    this.labels = await this.promptLabels()

    console.clear()

    this.writeIssue()
    this.writeBranch()
    this.writeFirstCommit()
    this.writeReviewers()
    this.writeDraft()
    this.writeLabels()
  }

  build() {
    if (!this.branch) throw new Error('missing branch value')

    return {
      branch: this.branch,
      draft: this.draft,
      reviewers: this.reviewers,
    }
  }
}
