import { Recent, RecentListItem, SerializedRecent } from './interface'

export function parseRecents(recents: SerializedRecent[]): Recent[] {
  return recents.map((r) => ({ value: r.value, date: new Date(r.date) }))
}

export function updateRecents(
  recents: Recent[],
  values: string[],
  maxSize: number = 10,
): Recent[] {
  const sortedValues = new Set<string>(
    [...values].sort((a, b) => a.localeCompare(b)).slice(0, maxSize),
  )

  const date = new Date()
  const removedRecents = recents.filter((r) => !sortedValues.has(r.value))
  removedRecents.unshift(
    ...Array.from(sortedValues.values()).map((value) => ({
      value,
      date,
    })),
  )

  return removedRecents.slice(0, maxSize)
}

export function buildRecentList(
  recents: Recent[],
  list: string[],
): RecentListItem[] {
  const set = new Set<string>(recents.map((r) => r.value))

  const items: RecentListItem[] = [
    ...Array.from(set).map((v) => ({ value: v, isRecent: true })),
    ...list.flatMap((v) => (set.has(v) ? [] : [{ value: v, isRecent: false }])),
  ]

  return items
}
