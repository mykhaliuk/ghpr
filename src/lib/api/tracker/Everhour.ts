import { request } from '../../utils'
import { Issue } from '../interfaces'
import { TrackerAPI } from './interfaces'

type TrackerResponse = {
  status: 'stopped' | 'active'
  duration?: number
  today?: number
  startedAt?: string
  userDate?: string
  user?: {
    avatarUrl: string
    avatarUrlLarge: string
    id: number
    email: string
    name: string
    headline: string
    createdAt: string
    enableResourcePlanner: boolean
    capacity: number
    resourcePlannerAccess: {
      viewMine: boolean
      editMine: boolean
      viewAll: boolean
      editAll: boolean
    }
  }
  task?: {
    projects: string[]
    attributes: string[]
    metrics: string[]
    completed: boolean
    id: string
    type: 'task' | 'pull-request'
    name: string
    url: string
    status: 'open' | 'merged' | 'closed'
    labels: string[]
    createdAt: string
    number: string
    time: {
      total: number
      timerTime: number
      users: any[]
    }
  }
}

export class Everhour implements TrackerAPI {
  constructor(private apiKey: string) {}

  async getActiveIssue(): Promise<Issue | null> {
    const { data } = await request<TrackerResponse>({
      method: 'get',
      protocol: 'https:',
      host: 'api.everhour.com',
      path: '/timers/current',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': this.apiKey,
      },
    })

    const { status, task } = data
    if (status === 'stopped' || !task) return null

    return {
      url: task.url,
      name: task.name,
      number: +task.number,
    }
  }
}
