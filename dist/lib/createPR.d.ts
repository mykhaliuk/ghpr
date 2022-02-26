declare type Issue = {
    name: string;
    url: string;
};
declare type PRParams = {
    base: string;
    commits: string;
    draft: string;
    firstCommit: string;
    issue: Issue;
    labels: string;
    me: string;
    reviewers: string;
};
export declare const createPR: (params: PRParams) => Promise<void>;
export {};
