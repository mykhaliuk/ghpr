import { Octokit } from '@octokit/core';
declare type APIConfig = {
    login: string;
    token: string;
    repo: string;
    owner: string;
};
export declare class Api {
    protected readonly me: string;
    protected readonly repo: string;
    protected readonly owner: string;
    protected readonly ok: Octokit;
    constructor({ token, login, owner, repo }: APIConfig);
    getCollabs(): Promise<import("@octokit/types").OctokitResponse<{
        login: string;
        id: number;
        email?: string | null | undefined;
        name?: string | null | undefined;
        node_id: string;
        avatar_url: string;
        gravatar_id: string | null;
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
        type: string;
        site_admin: boolean;
        permissions?: {
            pull: boolean;
            triage?: boolean | undefined;
            push: boolean;
            maintain?: boolean | undefined;
            admin: boolean;
        } | undefined;
    }[], 200>>;
    getLabels(): Promise<import("@octokit/types").OctokitResponse<{
        id: number;
        node_id: string;
        url: string;
        name: string;
        description: string | null;
        color: string;
        default: boolean;
    }[], 200>>;
}
export {};
