import { Recent, RecentListItem } from './recent/interface';
export type Issue = {
  url: string;
  name: string;
  number: number;
};

export interface PRInfo {
  branch: string;
  draft: boolean;
  reviewers: string[];
  labels: string[];
  commits: string[];
  issue: Issue | null;
}

export type TrackerApp = 'everhour'; // | 'toggl'

export type TrackerInfo = {
  app: TrackerApp;
  token: string;
};

export type RecentConfig = {
  branches: Recent[];
  reviewers: Recent[];
  labels: Recent[];
};

export type RecentKey = keyof RecentConfig;

export type APIConfig = {
  login: string;
  token: string;
  repo: string;
  owner: string;
  recents: RecentConfig;
  tracker?: TrackerInfo;
};

export type Collaborator = {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: '';
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: 'User';
  site_admin: false;
  permissions: {
    admin: true;
    maintain: true;
    push: true;
    triage: true;
    pull: true;
  };
  role_name: 'admin';
};

export type Label = {
  id: number;
  node_id: string;
  url: string;
  name: string;
  description: string | null;
  color: string;
  default: boolean;
};

export type APIClient = {
  getCollabs(): Promise<Collaborator[]>;
  getLabels(): Promise<Label[]>;
  getBranches(): Promise<string[]>;
  getTrackerIssue(): Promise<Issue | null>;
  getCommits(base: string): Promise<string[]>;
  publishPR(info: PRInfo): Promise<void>;

  withRecent(key: RecentKey, list: string[]): RecentListItem[];
  updateRecent(key: RecentKey, values: string[]): Recent[];
};
