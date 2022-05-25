import chalk from 'chalk';
import { prompt } from 'inquirer';
import autocomplete from 'inquirer-autocomplete-prompt';

import { APIClient, Issue, PRInfo } from './api';
import { RecentListItem } from './api/recent/interface';
import { withTempLine } from './utils';

prompt.registerPrompt('autocomplete', autocomplete);

export class PRBuilder {
  private branch: string | undefined;
  private issue: Issue | null = null;
  private reviewers: string[] = [];
  private labels: string[] = [];
  private draft: boolean = false;
  private commits: string[] = [];

  constructor(private api: APIClient) {}

  private static write(icon: string, title: string, data: string) {
    process.stdout.write(`${icon} ${chalk.bold(`${title}:`)} ${data}\n`);
  }

  private static async promptDraft(): Promise<boolean> {
    const { draft } = await prompt([
      {
        name: 'draft',
        message: 'Draft ?',
        prefix: '📑',
        type: 'confirm',
        default: false,
      },
    ]);

    return draft;
  }

  public async run(): Promise<PRInfo> {
    const { tracker } = this.api.config;

    switch (true) {
      case tracker?.app === 'everhour':
        this.issue = await withTempLine(
          'Lookup for Everhour issue...',
          async () => this.api.getTrackerIssue(),
        );

        if (!this.issue) {
          this.issue = await this.promptIssue();
        }
        break;
      case !tracker?.app:
      default:
        this.issue = await this.promptIssue();
    }

    console.clear();
    this.writeIssue();
    this.writeBranch();

    this.branch = await this.promptBranch();

    console.clear();
    this.writeIssue();
    this.writeBranch();

    this.commits = await withTempLine('Retrieve first commit', async () =>
      this.api.getCommits(this.branch!),
    );

    this.writeFirstCommit();

    this.reviewers = await this.promptReviewers();

    console.clear();

    this.writeIssue();
    this.writeBranch();
    this.writeFirstCommit();
    this.writeReviewers();

    this.draft = await PRBuilder.promptDraft();
    this.labels = await this.promptLabels();

    console.clear();

    this.writeIssue();
    this.writeBranch();
    this.writeFirstCommit();
    this.writeReviewers();
    this.writeDraft();
    this.writeLabels();

    return this.build();
  }

  private writeFirstCommit() {
    const [firstCommit = ''] = this.commits;
    PRBuilder.write('🚚', 'Title:', firstCommit);
  }

  private writeIssue() {
    PRBuilder.write('⏰', 'Issue', this.issue?.name ?? '');
  }

  private writeBranch() {
    PRBuilder.write('🌿', 'Branch', this.branch ?? '');
  }

  private writeReviewers() {
    PRBuilder.write('🤓', 'Reviewer', this.reviewers.join(', '));
  }

  private writeDraft() {
    PRBuilder.write('📑', 'Draft', this.draft ? 'Yes' : 'No');
  }

  private writeLabels() {
    PRBuilder.write('🏷 ', 'Labels', this.labels.join(', '));
  }

  private async promptBranch(): Promise<string> {
    const branches = await this.api.getBranches();

    const list = this.api.withRecent('branches', branches);
    const [branch] = await this.promptAutoComplete(list, 1, false);

    this.api.updateRecent('branches', [branch]);

    return branch;
  }

  private async promptAutoComplete(
    items: RecentListItem[],
    maxSelect = -1,
    stopOption: boolean = true,
  ) {
    const doneToken = '-- done --';
    let results = new Set<string>();

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
                const { value, isRecent } = item;
                let stopValue = [];
                if (idx === 0 && !input && stopOption)
                  stopValue.push(doneToken);

                if (results.has(value)) return stopValue;

                const name = `${isRecent ? '❤︎' : ` `} ${idx + 1}. ${value}`;

                if (!input) return [...stopValue, name];

                const regexpLogin = new RegExp(`${input.toLowerCase()}.*`);
                const regexpNum = new RegExp(`^${idx + 1}.*`);

                return regexpLogin.test(value.toLowerCase()) ||
                  regexpNum.test(input)
                  ? [...stopValue, name]
                  : stopValue;
              }),
            ),
        },
      ]);

      if (value === doneToken) break;

      value = value.replace(/.+(\d+\.|❤︎)\s+/, '');
      results.add(value);

      if (maxSelect > 0 && results.size >= maxSelect) break;
      if (items.length - results.size === 0) break;
    }

    return [...results];
  }

  private async promptReviewers(): Promise<string[]> {
    let collabs = await withTempLine('Search for collabs', () =>
      this.api.getCollabs(),
    );

    const list = this.api.withRecent(
      'reviewers',
      collabs.map((c) => c.login),
    );

    this.writeReviewers();
    let reviewers: string[] = await this.promptAutoComplete(list);

    this.api.updateRecent('reviewers', reviewers);

    return reviewers;
  }

  private async promptLabels(): Promise<string[]> {
    const gitLabels = await withTempLine('Search for labels...', () =>
      this.api.getLabels(),
    );

    this.writeLabels();

    const list = this.api.withRecent(
      'labels',
      gitLabels.map((l) => l.name),
    );

    const labels: string[] = await this.promptAutoComplete(list);

    this.api.updateRecent('labels', labels);

    return labels;
  }

  private async promptIssue(): Promise<Issue | null> {
    const issues = await withTempLine('Fetching GitHub issues...', () =>
      this.api.getGHIssues(),
    );

    this.writeIssue();

    const list: RecentListItem[] = issues.map(({ title, number }) => ({
      value: `#${number} - ${title}`,
      isRecent: false,
    }));

    const choices = await this.promptAutoComplete(list, 1);

    if (choices.length === 0) return null;

    const { html_url, title, number } = issues.find(({ title }) =>
      choices[0].includes(title),
    )!;

    return { name: title, url: html_url, number };
  }

  private build(): PRInfo {
    return {
      branch: this.branch!,
      draft: this.draft,
      reviewers: this.reviewers,
      labels: this.labels,
      commits: this.commits,
      issue: this.issue,
    };
  }
}
