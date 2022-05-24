import { APIClient } from './interfaces';
import { ApiClient } from './client';
import { getAPIConfig } from '../utils';

export async function createAPIClient(): Promise<APIClient> {
  const config = await getAPIConfig();

  return new ApiClient(config);
}
