export type Issue = {
  url: string
  name: string
  number: number
}

export type TrackerApp = 'everhour' // | 'toggl'

export type TrackerInfo = {
  app: TrackerApp
  token: string
}

export type APIConfig = {
  login: string
  token: string
  repo: string
  owner: string
  tracker?: TrackerInfo
}

export type Collaborator = {
  login: string
  id: number
  email?: string | null | undefined
  name?: string | null | undefined
  node_id: string
  avatar_url: string
  gravatar_id: string | null
  url: string
  html_url: string
}
export type Label = {
  id: number
  node_id: string
  url: string
  name: string
  description: string | null
  color: string
  default: boolean
}

export interface IAPIClient {
  getCollabs(): Promise<Collaborator[]>
  getLabels(): Promise<Label[]>
  getBranches(): Promise<string[]>
  getTrackerIssue(): Promise<Issue | null>
}
