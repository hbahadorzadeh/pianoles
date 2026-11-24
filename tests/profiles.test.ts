import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createProfile, loadProfiles, saveProfile } from '../src/progress'

function memoryStorage(snapshot: Record<string, string> = {}) {
  const items = new Map(Object.entries(snapshot))
  return { getItem: (key: string) => items.get(key) ?? null, setItem: (key: string, value: string) => { items.set(key, value) } }
}

test('a browser can create and resume independent named profiles', () => {
  const storage = memoryStorage()
  const catalog = loadProfiles(storage)
  assert.deepEqual(catalog, { activeId: null, profiles: [] })
  const alex = createProfile(' Alex ')
  const sam = createProfile('Sam')
  alex.progress.last = 90
  alex.progress.completed[87] = true
  alex.progress.best[2] = { pitch: 90, timing: 80 }
  sam.progress.last = 48
  sam.kidsMode = true
  saveProfile(catalog, alex, true, storage)
  saveProfile(catalog, sam, true, storage)
  const reopened = loadProfiles(storage)
  assert.equal(reopened.activeId, sam.id)
  assert.equal(reopened.profiles[0].name, 'Alex')
  assert.deepEqual(reopened.profiles[0].progress, alex.progress)
  assert.deepEqual(reopened.profiles[1].progress, sam.progress)
  assert.equal(reopened.profiles[1].kidsMode, true)
})

test('old standard and Kids progress is kept in two profiles with the previous view selected', () => {
  const adult = { last: 35, completed: { 1: true }, best: { 2: { pitch: 100, timing: 80 } } }
  const kids = { last: 48, completed: { 3: true }, best: {} }
  const storage = memoryStorage({
    'pianoles.progress.v1': JSON.stringify(adult),
    'pianoles.progress.v1.kids': JSON.stringify(kids),
    'pianoles.kids-mode': 'true',
  })
  const catalog = loadProfiles(storage)
  assert.equal(catalog.activeId, 'legacy-kids')
  assert.deepEqual(catalog.profiles.map(profile => profile.progress), [adult, kids])
  assert.deepEqual(loadProfiles(storage), catalog)
})

test('progress writes from stale tabs preserve other profiles and the best recorded score', () => {
  const storage = memoryStorage()
  const catalog = loadProfiles(storage)
  const first = createProfile('First')
  saveProfile(catalog, first, true, storage)
  const stale = loadProfiles(storage)
  const staleProfile = stale.profiles[0]
  first.progress.completed[2] = true
  first.progress.best[3] = { pitch: 100, timing: 80 }
  saveProfile(catalog, first, false, storage)
  const newProfile = createProfile('Second')
  saveProfile(catalog, newProfile, true, storage)
  staleProfile.progress.completed[1] = true
  staleProfile.progress.best[3] = { pitch: 60, timing: 60 }
  saveProfile(stale, staleProfile, false, storage)
  const reloaded = loadProfiles(storage)
  assert.equal(reloaded.profiles.length, 2)
  assert.equal(reloaded.activeId, newProfile.id)
  assert.deepEqual(reloaded.profiles[0].progress.completed, { 1: true, 2: true })
  assert.deepEqual(reloaded.profiles[0].progress.best[3], { pitch: 100, timing: 80 })
})
