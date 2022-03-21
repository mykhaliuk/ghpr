import { prompt } from 'inquirer'

import { APIClient } from './api/client'

export interface PRInfo {
  branch: string
}

export class PRBuilder {
  private branch: string | undefined

  constructor(private api: APIClient) {}

  async promptBranches(): Promise<void> {
    const branches = await this.api.getBranches()

    const { branch } = await prompt([
      {
        name: 'branch',
        prefix: '🌿',
        type: 'list',
        choices: branches,
        validate: (value) => {
          if (!value) return 'Please select a branch'
        },
      },
    ])

    this.branch = branch
  }

  build() {
    if (!this.branch) throw new Error('missing branch value')

    return {
      branch: this.branch,
    }
  }
}
