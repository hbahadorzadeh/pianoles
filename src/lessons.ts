export type Hand = 'left' | 'right'
export type Hands = Hand | 'both'
export type Finger = 1 | 2 | 3 | 4 | 5
export type Note = { midi: number; spelling: string; finger?: Finger }
export type Event = { hand: Hand; beat: number; duration: number; notes: Note[] }
export type PedalCue = { beat: number; down: boolean }
export type Lesson = {
  id: number
  title: string
  instruction: string
  tempo: number
  meter: number
  key: string
  measures: number
  hands: Hand[]
  events: Event[]
  pedal: PedalCue[]
  credit?: string
}
export type LessonUnit = { title: string; lessons: CatalogLesson[] }

export const pianoRange = { low: 36, high: 77 }
export const keySignatures: Record<string, Record<string, string>> = {
  C: {}, Am: {},
  G: { F: '#' }, Em: { F: '#' },
  D: { F: '#', C: '#' }, Bm: { F: '#', C: '#' },
  F: { B: 'b' }, Dm: { B: 'b' },
  Bb: { B: 'b', E: 'b' }, Gm: { B: 'b', E: 'b' },
  Eb: { B: 'b', E: 'b', A: 'b' }, Cm: { B: 'b', E: 'b', A: 'b' },
}

export const theoryValues = ['sixteenth', 'eighth', 'quarter', 'dotted-quarter', 'half', 'dotted-half', 'whole'] as const
export type TheoryValue = typeof theoryValues[number]
export const theoryMeters = ['2/2', '2/4', '3/4', '4/4', '6/8'] as const
export type TheoryMeter = typeof theoryMeters[number]
export type TheoryVisual =
  | { type: 'note'; pitch: string; midi: number; clef: 'treble' | 'bass'; value: TheoryValue }
  | { type: 'rest'; value: TheoryValue }
  | { type: 'meter'; signature: TheoryMeter }
export type TheoryExample = { label: string; explanation: string; visual: TheoryVisual }
export type TheoryQuestion = { prompt: string; visual?: TheoryVisual; choices: string[]; answer: string; explanation: string }
export type TheoryLesson = {
  kind: 'theory'
  id: number
  title: string
  instruction: string
  examples: TheoryExample[]
  questions: TheoryQuestion[]
}
export type CatalogLesson = (Lesson & { kind: 'playing' }) | TheoryLesson
