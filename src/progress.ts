import type { Scores } from './practice'

type Progress = { last: number; completed: Record<number, true>; best: Record<number, Scores> }
const key = 'pianoles.progress.v1'

export function loadProgress(): Progress {
  const empty = { last: 1, completed: {}, best: {} }
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? 'null')
    if (saved && typeof saved === 'object') return { ...empty, ...saved }
  } catch {
    // Browser storage may be blocked or cleared.
  }
  return empty
}

export function saveProgress(progress: Progress): void {
  try {
    localStorage.setItem(key, JSON.stringify(progress))
  } catch {
    // The current session retains its progress in memory.
  }
}
