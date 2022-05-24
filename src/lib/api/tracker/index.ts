import { throwError } from '../../utils';
import { TrackerAppName } from '../interfaces';
import { Everhour } from './Everhour';
import { TrackerAPI } from './interfaces';

export const TrackerFactory = {
  create(app: TrackerAppName, apiKey: string): TrackerAPI {
    if (app === 'everhour') {
      return new Everhour(apiKey);
    }

    throw throwError(`Tracker ${app} is not handled`);
  },
};
