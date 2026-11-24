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
export type LessonUnit = { title: string; lessons: Lesson[] }

export const pianoRange = { low: 36, high: 77 }
export const keySignatures: Record<string, Record<string, string>> = {
  C: {}, Am: {},
  G: { F: '#' }, Em: { F: '#' },
  D: { F: '#', C: '#' }, Bm: { F: '#', C: '#' },
  F: { B: 'b' }, Dm: { B: 'b' },
  Bb: { B: 'b', E: 'b' }, Gm: { B: 'b', E: 'b' },
  Eb: { B: 'b', E: 'b', A: 'b' }, Cm: { B: 'b', E: 'b', A: 'b' },
}
