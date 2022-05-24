export type Recent = {
  date: Date;
  value: string;
};

export type RecentListItem = {
  value: string;
  isRecent: boolean;
};

export type SerializedRecent = {
  date: string;
  value: string;
};
