import { readdirSync, readFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { parse } from 'yaml'
import { keySignatures, pianoRange, type Event, type Finger, type Hand, type Lesson, type LessonUnit, type Note, type PedalCue } from './lessons'

const semitones: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
const durations = [0.5, 1, 1.5, 2, 3, 4]
const handsInOrder: Hand[] = ['right', 'left']

function mapping(value: unknown, fields: string[], name: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${name} must be a mapping`)
  const record = value as Record<string, unknown>
  for (const field of Object.keys(record)) {
    if (!fields.includes(field)) throw new Error(`Unknown field ${name}.${field}`)
  }
  return record
}

function readText(value: unknown, name: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${name} must be nonempty text`)
  return value.trim()
}

function readInteger(value: unknown, name: string, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer from ${min} to ${max}`)
  }
  return value
}

function readNote(token: string): Note {
  const match = /^(([A-G])([#b]?)([0-8]))(?:\/([1-5]))?$/.exec(token)
  if (!match) throw new Error(`Invalid note ${token}`)
  const [, spelling, letter, accidental, octave, suggestedFinger] = match
  const midi = 12 * (Number(octave) + 1) + semitones[letter] + (accidental === '#' ? 1 : accidental === 'b' ? -1 : 0)
  if (midi < pianoRange.low || midi > pianoRange.high) throw new Error(`Note ${spelling} is outside C2–F5`)
  return suggestedFinger ? { midi, spelling, finger: Number(suggestedFinger) as Finger } : { midi, spelling }
}

function readPart(value: unknown, hand: Hand, meter: number): { events: Event[]; measures: number } {
  if (!Array.isArray(value) || !value.length) throw new Error(`${hand} part must list at least one measure`)
  const events = value.flatMap((bar, index) => {
    try {
      let beat = index * meter
      const notes = readText(bar, 'measure').split(/\s+/).map(token => {
        const [pitches, beats = '1', extra] = token.split(':')
        const duration = Number(beats)
        if (extra !== undefined || !durations.includes(duration)) throw new Error(`Invalid duration in ${token}`)
        const notes = pitches === '-' ? [] : pitches.split('+').map(readNote)
        if (new Set(notes.map(note => note.midi)).size !== notes.length) throw new Error(`Repeated pitch in chord ${token}`)
        const fingers = notes.flatMap(note => note.finger ?? [])
        if (new Set(fingers).size !== fingers.length) throw new Error(`Repeated finger in chord ${token}`)
        const event = { hand, beat, duration, notes }
        beat += duration
        return event
      })
      if (beat !== (index + 1) * meter) throw new Error(`Expected ${meter} beats, found ${beat - index * meter}`)
      return notes
    } catch (error) {
      throw new Error(`${hand} measure ${index + 1}: ${(error as Error).message}`)
    }
  })
  if (!events.some(event => event.notes.length)) throw new Error(`${hand} part has no notes`)
  return { events, measures: value.length }
}

function readPedal(value: unknown, measures: number, meter: number): PedalCue[] {
  if (value === undefined) return []
  if (!Array.isArray(value)) throw new Error('pedal must list cues')
  let previousBeat = -1
  let down = false
  const cues = value.map(cue => {
    const { measure, beat: beatInMeasure, action } = mapping(cue, ['measure', 'beat', 'action'], 'pedal cue')
    const bar = readInteger(measure, 'pedal measure', 1, measures + 1)
    if (typeof beatInMeasure !== 'number' || beatInMeasure < 1 || beatInMeasure >= meter + 1 || !Number.isInteger(beatInMeasure * 2)) {
      throw new Error(`Pedal beat must be a whole or half beat within the measure`)
    }
    const beat = (bar - 1) * meter + beatInMeasure - 1
    if (beat > measures * meter || beat <= previousBeat) throw new Error('Pedal cues must be in order and within the score')
    if (action !== (down ? 'up' : 'down')) throw new Error('Pedal cues must alternate down and up, starting with down')
    previousBeat = beat
    down = action === 'down'
    return { beat, down }
  })
  if (down) throw new Error('Add a pedal up cue before or at the end of the lesson')
  return cues
}

export function parseLesson(contents: string): Lesson & { unit: string } {
  const raw = mapping(parse(contents, { maxAliasCount: 0 }), ['id', 'unit', 'title', 'instruction', 'tempo', 'meter', 'key', 'credit', 'parts', 'pedal'], 'lesson')
  const id = readInteger(raw.id, 'id', 1, Number.MAX_SAFE_INTEGER)
  const unit = readText(raw.unit, 'unit')
  const title = readText(raw.title, 'title')
  const instruction = readText(raw.instruction, 'instruction')
  const tempo = readInteger(raw.tempo, 'tempo', 35, 150)
  const meter = readInteger(raw.meter, 'meter', 2, 4)
  const key = readText(raw.key, 'key')
  if (!Object.hasOwn(keySignatures, key)) throw new Error(`Unsupported key ${key}`)
  const credit = raw.credit === undefined ? undefined : readText(raw.credit, 'credit')
  const parts = mapping(raw.parts, handsInOrder, 'parts')
  const hands = handsInOrder.filter(hand => Object.hasOwn(parts, hand))
  if (!hands.length) throw new Error('parts must contain at least one hand')
  const parsed = hands.map(hand => readPart(parts[hand], hand, meter))
  const measures = parsed[0].measures
  if (parsed.some(part => part.measures !== measures)) throw new Error('Both parts must have the same number of measures')
  return {
    id, unit, title, instruction, tempo, meter, key, measures, hands,
    ...(credit ? { credit } : {}),
    events: parsed.flatMap(part => part.events),
    pedal: readPedal(raw.pedal, measures, meter),
  }
}

export function lessonFiles(folder: string): string[] {
  return readdirSync(folder, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => join(folder, entry.name, 'lesson.yaml'))
}

export function loadCatalog(files: string[]): { units: LessonUnit[]; lessons: Lesson[] } {
  if (!files.length) throw new Error('No lesson files found')
  const entries = files.map(file => {
    try {
      const lesson = parseLesson(readFileSync(file, 'utf8'))
      const folder = basename(dirname(file))
      const match = /^(\d{3,})-[a-z0-9]+(?:-[a-z0-9]+)*$/.exec(folder)
      if (!match || Number(match[1]) !== lesson.id) throw new Error('Folder must be named NNN-slug and match the lesson id')
      return { file, lesson }
    } catch (error) {
      throw new Error(`${file}: ${(error as Error).message}`)
    }
  }).sort((a, b) => a.lesson.id - b.lesson.id)

  const units: LessonUnit[] = []
  const lessons: Lesson[] = []
  for (const { file, lesson: { unit, ...lesson } } of entries) {
    if (lesson.id !== lessons.length + 1) throw new Error(`${file}: expected lesson id ${lessons.length + 1}; found ${lesson.id}`)
    let group = units.at(-1)
    if (group?.title !== unit) {
      if (units.some(entry => entry.title === unit)) throw new Error(`${file}: unit "${unit}" must occupy one continuous range of ids`)
      group = { title: unit, lessons: [] }
      units.push(group)
    }
    group.lessons.push(lesson)
    lessons.push(lesson)
  }
  return { units, lessons }
}
