import { Recent, RecentListItem, SerializedRecent } from './interface';

export function parseRecent(recent: SerializedRecent[]): Recent[] {
  return recent.map((r) => ({ value: r.value, date: new Date(r.date) }));
}

export function updateRecent(
  recent: Recent[],
  values: string[],
  maxSize: number = 10,
): Recent[] {
  const sortedValues = new Set<string>(
    [...values].sort((a, b) => a.localeCompare(b)).slice(0, maxSize),
  );

  const date = new Date();
  const removedRecent = recent.filter((r) => !sortedValues.has(r.value));
  removedRecent.unshift(
    ...[...sortedValues.values()].map((value) => ({
      value,
      date,
    })),
  );

  return removedRecent.slice(0, maxSize);
}

export function buildRecentList(
  recent: Recent[],
  list: string[],
): RecentListItem[] {
  const set = new Set<string>(recent.map(({ value }) => value));

  const items: RecentListItem[] = [
    // filter recent that do not exist in current list
    ...[...set].flatMap((v) =>
      list.includes(v) ? [{ value: v, isRecent: true }] : [],
    ),
    ...list.flatMap((v) => (set.has(v) ? [] : [{ value: v, isRecent: false }])),
  ];

  return items;
}
