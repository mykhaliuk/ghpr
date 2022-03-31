import chalk from 'chalk'
import { prompt } from 'inquirer'
import autocomplete from 'inquirer-autocomplete-prompt'

import { IAPIClient, Issue, PRInfo } from './api'
import { RecentListItem } from './api/recent/interface'
import { withTempLine } from './utils'

prompt.registerPrompt('autocomplete', autocomplete)

export class PRBuilder {
  private branch: string | undefined
  private issue: Issue | null = null
  private reviewers: string[] = []
  private labels: string[] = []
  private draft: boolean = false
  private commits: string[] = []

  constructor(private api: IAPIClient) {}

  private write(icon: string, title: string, data: string) {
    process.stdout.write(`${icon} ${chalk.bold(`${title}:`)} ${data}\n`)
  }

  private writeFirstCommit() {
    const [firstCommit = ''] = this.commits
    this.write('🚚', 'Title:', firstCommit)
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

    const list = this.api.withRecents('branches', branches)
    const [branch] = await this.promptAutoComplete(list, 1, false)

    this.api.updateRecent('branches', [branch])

    return branch
  }

  private async promptAutoComplete(
    items: RecentListItem[],
    maxSelect = -1,
    stopOption: boolean = true,
  ) {
    const doneToken = '-- done --'

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
              items.flatMap((item, idx) => {
                const { value, isRecent } = item
                let stopValue = []
                if (idx === 0 && !input && stopOption) stopValue.push(doneToken)

                if (results.has(value)) return stopValue

                const name = `${isRecent ? '🕘' : ` ‣`} ${idx + 1}. ${value}`

                if (!input) return [...stopValue, name]

                const regexpLogin = new RegExp(`${input.toLowerCase()}.*`)
                const regexpNum = new RegExp(`^${idx + 1}.*`)

                return regexpLogin.test(value.toLowerCase()) ||
                  regexpNum.test(input)
                  ? [...stopValue, name]
                  : stopValue
              }),
            ),
        },
      ])

      if (value === doneToken) break

      value = value.replace(/.+(\d+\.|🕘)\s+/, '')
      results.add(value)

      if (maxSelect > 0 && results.size >= maxSelect) break
      if (items.length - results.size === 0) break
    }

    return Array.from(results)
  }

  private async promptReviewers(): Promise<string[]> {
    let collabs = await withTempLine('Search for collabs', () =>
      this.api.getCollabs(),
    )

    const list = this.api.withRecents(
      'reviewers',
      collabs.map((c) => c.login),
    )

    this.writeReviewers()
    let reviewers: string[] = await this.promptAutoComplete(list)

    this.api.updateRecent('reviewers', reviewers)

    return reviewers
  }

  private async promptLabels(): Promise<string[]> {
    let gitLabels = await withTempLine('Search for labels', () =>
      this.api.getLabels(),
    )

    this.writeLabels()

    const list = this.api.withRecents(
      'labels',
      gitLabels.map((l) => l.name),
    )

    const labels: string[] = await this.promptAutoComplete(list)

    this.api.updateRecent('labels', labels)

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

    console.clear()

    this.writeIssue()
    this.writeBranch()

    this.commits = await withTempLine('Retrieve first commit', async () =>
      this.api.getCommits(this.branch!),
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
      commits: this.commits,
      issue: this.issue,
    }
  }
}
