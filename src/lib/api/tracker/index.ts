import { TrackerApp } from '../interfaces'
import { Everhour } from './Everhour'
import { TrackerAPI } from './interfaces'

export const TrackerFactory = {
  create(app: TrackerApp, apiKey: string): TrackerAPI {
    if (app === 'everhour') {
      return new Everhour(apiKey)
    }

    throw new Error(`Tracker ${app} is not handled`)
  },
}
