import { Octokit } from '@octokit/core'

import { exec } from '../utils'
import { APIConfig, IAPIClient } from './interfaces'

export class APIClient implements IAPIClient {
  protected readonly me: string
  protected readonly repo: string
  protected readonly owner: string
  protected readonly ok: Octokit

  constructor({ token, login, owner, repo }: APIConfig) {
    this.me = login
    this.owner = owner
    this.repo = repo
    this.ok = new Octokit({ auth: token })
  }

  public async getBranches(): Promise<string[]> {
    const data = await exec(
      `git branch -l | grep -v "*" | grep -v "/" | sed -E "s/^ +//"`,
    )

    return (data || 'main').split('\n').filter(Boolean)
  }

  public async getCollabs() {
    const collabs = await this.ok.request(
      'GET /repos/{owner}/{repo}/collaborators',
      {
        owner: this.owner,
        repo: this.repo,
      },
    )

    return collabs.data
  }

  public async getLabels() {
    const labels = await this.ok.request('GET /repos/{owner}/{repo}/labels', {
      owner: this.owner,
      repo: this.repo,
    })

    return labels.data
  }
}
