import { Octokit } from '@octokit/core'

import { exec } from '../utils'
import {
  APIConfig,
  Collaborator,
  IAPIClient,
  Issue,
  TrackerInfo,
} from './interfaces'
import { TrackerFactory } from './tracker/index'

export class APIClient implements IAPIClient {
  protected readonly config: APIConfig
  protected readonly ok: Octokit

  constructor(config: APIConfig) {
    this.config = config
    const { token } = this.config

    this.ok = new Octokit({ auth: token })
  }

  get owner() {
    return this.config.owner
  }

  get repo() {
    return this.config.repo
  }

  get trackerApp(): TrackerInfo | undefined {
    return this.config.tracker
  }

  public async getBranches(): Promise<string[]> {
    const data = await exec(
      `git branch -l | grep -v "*" | grep -v "/" | sed -E "s/^ +//"`,
    )

    return (data || 'main').split('\n').filter(Boolean)
  }

  public async getFirstCommit(base: string): Promise<string> {
    const data = await exec(
      `git cherry ${base} -v | head -n 1 | sed -E "s/(\\+|-) [^ ]+ //"`,
    )

    return data.replace(/\n/g, '')
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
    )

    return collabs.data as Collaborator[]
  }

  public async getLabels() {
    const labels = await this.ok.request('GET /repos/{owner}/{repo}/labels', {
      owner: this.owner,
      repo: this.repo,
      per_page: 100,
      page: 1,
    })

    return labels.data
  }

  public async getTrackerIssue(): Promise<Issue | null> {
    const trackerInfo = this.trackerApp
    if (!trackerInfo) return null

    const trackerAPI = TrackerFactory.create(trackerInfo.app, trackerInfo.token)

    const issue = await trackerAPI.getActiveIssue()

    return issue
  }
}
