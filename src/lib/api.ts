import { Octokit } from '@octokit/core';

type APIConfig = {
  login: string;
  token: string;
  repo: string;
  owner: string;
};

export class Api {
  protected readonly me: string;
  protected readonly repo: string;
  protected readonly owner: string;
  protected readonly ok: Octokit;

  constructor({ token, login, owner, repo }: APIConfig) {
    this.me = login;
    this.owner = owner;
    this.repo = repo;
    this.ok = new Octokit({ auth: token });
  }

  public async getCollabs() {
    return this.ok.request('GET /repos/{owner}/{repo}/collaborators', {
      owner: this.owner,
      repo: this.repo,
    });
  }

  public async getLabels() {
    return this.ok.request('GET /repos/{owner}/{repo}/labels', {
      owner: this.owner,
      repo: this.repo,
    });
  }
}
