import { Issue } from '../interfaces'

export interface TrackerAPI {
  getActiveIssue(): Promise<Issue | null>
}
