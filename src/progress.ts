import type { Scores } from './practice'

type Progress = { last: number; completed: Record<number, true>; best: Record<number, Scores> }
export type Profile = { id: string; name: string; kidsMode: boolean; progress: Progress }
export type Profiles = { activeId: string | null; profiles: Profile[] }
type LocalStorage = Pick<Storage, 'getItem' | 'setItem'>
const key = 'pianoles.profiles.v2'
const legacyKey = 'pianoles.progress.v1'

export function emptyProgress(): Progress {
  return { last: 1, completed: {}, best: {} }
}

function read(key: string, storage?: LocalStorage): unknown {
  try {
    return JSON.parse((storage ?? localStorage).getItem(key) ?? 'null')
  } catch {
    return null
  }
}

function write(data: Profiles, storage?: LocalStorage): void {
  try {
    (storage ?? localStorage).setItem(key, JSON.stringify(data))
  } catch {
    // Keep the active profiles in memory if storage is unavailable.
  }
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined
}

function normalizeProgress(value: unknown): Progress | undefined {
  const raw = record(value)
  if (!raw) return
  const progress = emptyProgress()
  if (typeof raw.last === 'number' && Number.isSafeInteger(raw.last) && raw.last > 0) progress.last = raw.last
  for (const [id, complete] of Object.entries(record(raw.completed) ?? {})) {
    if (/^[1-9]\d*$/.test(id) && complete === true) progress.completed[Number(id)] = true
  }
  for (const [id, best] of Object.entries(record(raw.best) ?? {})) {
    const score = record(best)
    const pitch = score?.pitch
    const timing = score?.timing
    if (/^[1-9]\d*$/.test(id) && typeof pitch === 'number' && typeof timing === 'number' &&
        pitch >= 0 && pitch <= 100 && timing >= 0 && timing <= 100) progress.best[Number(id)] = { pitch, timing }
  }
  return progress
}

function readProfiles(storage?: LocalStorage): Profiles | undefined {
  const value = record(read(key, storage))
  if (!value || !Array.isArray(value.profiles)) return
  const profiles: Profile[] = []
  for (const entry of value.profiles) {
    const profile = record(entry)
    if (typeof profile?.id !== 'string' || typeof profile.name !== 'string' ||
        !profile.name.trim() || profiles.some(item => item.id === profile.id)) continue
    const progress = normalizeProgress(profile.progress)
    if (progress) profiles.push({ id: profile.id, name: profile.name, kidsMode: profile.kidsMode === true, progress })
  }
  const activeId = profiles.find(profile => profile.id === value.activeId)?.id ?? profiles[0]?.id ?? null
  return { activeId, profiles }
}

export function loadProfiles(storage?: LocalStorage): Profiles {
  const current = readProfiles(storage)
  if (current) return current
  const profiles: Profile[] = []
  const adult = normalizeProgress(read(legacyKey, storage))
  const kids = normalizeProgress(read(legacyKey + '.kids', storage))
  if (adult) profiles.push({ id: 'legacy-standard', name: 'My profile', kidsMode: false, progress: adult })
  if (kids) profiles.push({ id: 'legacy-kids', name: 'Kids', kidsMode: true, progress: kids })
  const activeId = (read('pianoles.kids-mode', storage) === true && kids ? 'legacy-kids' : profiles[0]?.id) ?? null
  const migrated = { profiles, activeId }
  if (profiles.length) write(migrated, storage)
  return migrated
}

export function createProfile(name: string): Profile {
  return { id: crypto.randomUUID(), name: name.trim(), kidsMode: false, progress: emptyProgress() }
}

export function saveProfile(data: Profiles, profile: Profile, activate = false, storage?: LocalStorage): void {
  const persisted = readProfiles(storage)
  const earlier = persisted?.profiles.find(item => item.id === profile.id)
  if (earlier) {
    Object.assign(profile.progress.completed, earlier.progress.completed)
    for (const [id, score] of Object.entries(earlier.progress.best)) {
      const current = profile.progress.best[Number(id)]
      if (!current || score.pitch + score.timing > current.pitch + current.timing) profile.progress.best[Number(id)] = score
    }
  }
  const profiles = new Map(data.profiles.map(item => [item.id, item]))
  for (const item of persisted?.profiles ?? []) profiles.set(item.id, item)
  profiles.set(profile.id, profile)
  data.profiles = [...profiles.values()]
  data.activeId = activate ? profile.id : persisted?.activeId ?? data.activeId
  write(data, storage)
}
