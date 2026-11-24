import type { Scores } from './practice'

type Progress = { last: number; completed: Record<number, true>; best: Record<number, Scores> }
const key = 'pianoles.progress.v1'
const modeKey = 'pianoles.kids-mode'

export function readKidsMode(): boolean {
  try { return localStorage.getItem(modeKey) === 'true' } catch { return false }
}

export function saveKidsMode(enabled: boolean): void {
  try { localStorage.setItem(modeKey, String(enabled)) } catch { /* The current tab retains the mode. */ }
}

export function loadProgress(kidsMode: boolean): Progress {
  const empty = { last: 1, completed: {}, best: {} }
  try {
    const saved = JSON.parse(localStorage.getItem(kidsMode ? key + '.kids' : key) ?? 'null')
    if (saved && typeof saved === 'object') return { ...empty, ...saved }
  } catch {
    // Browser storage may be blocked or cleared.
  }
  return empty
}

export function saveProgress(progress: Progress, kidsMode: boolean): void {
  try {
    localStorage.setItem(kidsMode ? key + '.kids' : key, JSON.stringify(progress))
  } catch {
    // The current session retains its progress in memory.
  }
}
