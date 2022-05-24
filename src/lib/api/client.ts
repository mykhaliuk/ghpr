import { Octokit } from '@octokit/core';

import { deleteLastLine, exec, normalize, spawn, tempLine } from '../utils';
import { saveConfig } from './init';
import {
  APIConfig,
  Collaborator,
  APIClient,
  Issue,
  PRInfo,
  TrackerInfo,
} from './interfaces';
import { RecentKey as RecentKey } from './interfaces';
import { buildRecentList, updateRecent } from './recent';
import { Recent, RecentListItem } from './recent/interface';
import { TrackerFactory } from './tracker/index';

export class ApiClient implements APIClient {
  protected readonly config: APIConfig;
  protected readonly ok: Octokit;

  constructor(config: APIConfig) {
    this.config = config;
    const { token } = this.config;

    this.ok = new Octokit({ auth: token });
  }

  get login() {
    return this.config.login;
  }

  get owner() {
    return this.config.owner;
  }

  get repo() {
    return this.config.repo;
  }

  get trackerApp(): TrackerInfo | undefined {
    return this.config.tracker;
  }

  public async getBranches(): Promise<string[]> {
    const branches = await this.ok.request(
      'GET /repos/{owner}/{repo}/branches',
      {
        owner: this.owner,
        repo: this.repo,
        per_page: 100,
        page: 1,
      },
    );

    if (!branches.data?.length) throw new Error('Error getting branches');

    const res = branches.data?.map(({ name }) => name);
    return res;
  }

  public async getCommits(base: string): Promise<string[]> {
    const data = await exec(
      `git cherry ${base} -v | sed -E "s/(\\+|-) [^ ]+ //"`,
    );

    return data.split('\n').filter(Boolean);
  }

  public async getCollabs(): Promise<Collaborator[]> {
    const collabs = await this.ok.request(
      'GET /repos/{owner}/{repo}/collaborators',
      {
        owner: this.owner,
        repo: this.repo,
        per_page: 100,
        page: 1,
      },
    );

    return collabs.data as Collaborator[];
  }

  private getRecent(key: RecentKey): Recent[] {
    return this.config.recents[key];
  }

  public withRecent(key: RecentKey, list: string[]): RecentListItem[] {
    return buildRecentList(this.getRecent(key), list);
  }

  public updateRecent(key: RecentKey, values: string[]): Recent[] {
    const newList = updateRecent(this.config.recents[key], values, 10);
    this.config.recents[key] = newList;

    this.saveConfig();
    return newList;
  }

  private saveConfig() {
    saveConfig(this.config);
  }

  public async getLabels() {
    const labels = await this.ok.request('GET /repos/{owner}/{repo}/labels', {
      owner: this.owner,
      repo: this.repo,
      per_page: 100,
      page: 1,
    });

    return labels.data;
  }

  public async getTrackerIssue(): Promise<Issue | null> {
    const trackerInfo = this.trackerApp;
    if (!trackerInfo) return null;

    const trackerAPI = TrackerFactory.create(
      trackerInfo.app,
      trackerInfo.token,
    );

    const issue = await trackerAPI.getActiveIssue();

    return issue;
  }

  public async publishPR(info: PRInfo) {
    console.clear();

    tempLine('Creating pull request...');
    const { commits, issue, draft, reviewers, labels, branch } = info;

    const [firstCommit = ''] = commits;

    let body = `${firstCommit}\n\n`;
    if (issue) {
      body += `**Related to issue:** ${`[${issue.name} #${issue.number}](${issue.url})\n\n`}`;
    }

    body += `## Changelog:\n\n`;
    if (commits.length > 0) {
      body += `- ${commits.join('\n- ')}\n\n`;
    }

    const draftOption = draft ? '-d' : '';

    const command = [
      'hub',
      'pull-request',
      draftOption,
      '-p -f',
      `-a ${this.login}`,
      `-r "${reviewers.join(',')}"`,
      `-l "${labels.join(',')}"`,
      `-b "${normalize(branch)}"`,
      `-m "${normalize(body)}"`,
      '--edit',
    ];

    let progressStringRemoved = false;
    await spawn(
      command.join(' '),
      (data) => {
        if (!progressStringRemoved) {
          deleteLastLine();
          progressStringRemoved = true;
        }
        process.stdout.write(data);
      },
      {
        GITHUB_TOKEN: this.config.token,
      },
    );
  }
}
