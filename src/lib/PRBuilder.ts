import chalk from 'chalk'
import { prompt } from 'inquirer'
import autocomplete from 'inquirer-autocomplete-prompt'

import { Issue } from './api'
import { APIClient } from './api/client'
import { withTempLine } from './utils'

prompt.registerPrompt('autocomplete', autocomplete)

export interface PRInfo {
  branch: string
  draft: boolean
  reviewers: string[]
  labels: string[]
  commit?: string
  issue: Issue | null
}

export class PRBuilder {
  private branch: string | undefined
  private issue: Issue | null = null
  private reviewers: string[] = []
  private labels: string[] = []
  private draft: boolean = false
  private commit: string | undefined

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

  private async promptAutoComplete<T>(
    values: T[],
    mapper: (value: T) => string,
  ) {
    const doneToken = '--done--'
    let filteredValues = values.map(mapper)

    let results = new Set<string>()
    while (true) {
      let { value } = await prompt([
        {
          name: 'value',
          message: '- ',
          prefix: '',
          type: 'autocomplete',
          source: (_: string, input: string) =>
            Promise.resolve(
              filteredValues.flatMap((value, idx) => {
                let stopValue = []
                if (idx === 0 && !input) stopValue.push(doneToken)

                if (results.has(value)) return stopValue

                const name = `${idx + 1}. ${value}`

                if (!input) return [...stopValue, name]

                const regexpLogin = new RegExp(`${input.toLowerCase()}.*`)
                const regexpNum = new RegExp(`${idx}.*`)

                return regexpLogin.test(name.toLowerCase()) ||
                  regexpNum.test(input)
                  ? [...stopValue, name]
                  : stopValue
              }),
            ),
        },
      ])

      if (value === doneToken) break

      value = value.replace(/^\d+\. /, '')
      results.add(value)

      if (filteredValues.length - results.size === 0) break
    }

    return Array.from(results)
  }

  private async promptReviewers(): Promise<string[]> {
    let collabs = await withTempLine('Search for collabs', () =>
      this.api.getCollabs(),
    )

    this.writeReviewers()
    let reviewers: string[] = await this.promptAutoComplete(
      collabs,
      (c) => c.login,
    )

    return reviewers
  }

  private async promptLabels(): Promise<string[]> {
    let gitLabels = await withTempLine('Search for labels', () =>
      this.api.getLabels(),
    )

    this.writeLabels()
    const labels: string[] = await this.promptAutoComplete(
      gitLabels,
      (l) => l.name,
    )

    return labels
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

  async run(): Promise<PRInfo> {
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

    return this.build()
  }

  private build(): PRInfo {
    return {
      branch: this.branch!,
      draft: this.draft,
      reviewers: this.reviewers,
      labels: this.labels,
      commit: this.commit,
      issue: this.issue,
    }
  }
}
