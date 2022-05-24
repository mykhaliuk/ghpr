import { Endpoints } from '@octokit/types';
import { Recent, RecentListItem } from './recent/interface';

export type Issue = {
  name: string;
  number: number;
  url: string;
};

export type GHIssues = Endpoints['GET /issues']['response']['data'];

export type PRInfo = {
  branch: string;
  commits: string[];
  draft: boolean;
  issue: Issue | null;
  labels: string[];
  reviewers: string[];
};

export type TrackerAppName = 'everhour'; // | 'toggl'

export type TrackerInfo = {
  app: TrackerAppName;
  token: string;
};

export type RecentConfig = {
  branches: Recent[];
  labels: Recent[];
  reviewers: Recent[];
};

export type RecentKey = keyof RecentConfig;

export type APIConfig = {
  login: string;
  owner: string;
  recents: RecentConfig;
  repo: string;
  token: string;
  tracker?: TrackerInfo;
};

export type Collaborator = {
  avatar_url: string;
  events_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  gravatar_id: '';
  html_url: string;
  id: number;
  login: string;
  node_id: string;
  organizations_url: string;
  received_events_url: string;
  repos_url: string;
  site_admin: false;
  starred_url: string;
  subscriptions_url: string;
  type: 'User';
  url: string;
  permissions: {
    admin: true;
    maintain: true;
    pull: true;
    push: true;
    triage: true;
  };
  role_name: 'admin';
};

export type Label = {
  color: string;
  default: boolean;
  description: string | null;
  id: number;
  name: string;
  node_id: string;
  url: string;
};

export type APIClient = {
  getBranches(): Promise<string[]>;
  getCollabs(): Promise<Collaborator[]>;
  getCommits(base: string): Promise<string[]>;
  getGHIssues(): Promise<GHIssues>;
  getLabels(): Promise<Label[]>;
  getTrackerIssue(): Promise<Issue | null>;
  publishPR(info: PRInfo): Promise<void>;
  updateRecent(key: RecentKey, values: string[]): Recent[];
  withRecent(key: RecentKey, list: string[]): RecentListItem[];
  config: APIConfig;
};
