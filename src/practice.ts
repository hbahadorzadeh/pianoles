import type { Hands, Lesson } from './lessons'

export type Step = { beat: number; pitches: Set<number> }
export type Scores = { pitch: number; timing: number }

export function practiceSteps(lesson: Lesson, hands: Hands, first: number, last: number): Step[] {
  const steps = new Map<number, Step>()
  for (const event of lesson.events) {
    const bar = Math.floor(event.beat / lesson.meter) + 1
    if ((hands !== 'both' && event.hand !== hands) || bar < first || bar > last || !event.notes.length) continue
    const beat = event.beat - (first - 1) * lesson.meter
    const step = steps.get(beat) ?? { beat, pitches: new Set<number>() }
    for (const note of event.notes) step.pitches.add(note.midi)
    steps.set(beat, step)
  }
  return [...steps.values()].sort((a, b) => a.beat - b.beat)
}

export type Hit = { pitch: number; beat: number }

export function scoreAttempt(steps: Step[], hits: Hit[], secondsPerBeat: number): Scores {
  const expected = steps.flatMap(step => [...step.pitches].map(pitch => ({ pitch, beat: step.beat })))
  if (!expected.length) return { pitch: 0, timing: 0 }
  const orderedHits = [...hits].sort((a, b) => a.beat - b.beat)
  const used = new Set<number>()
  let correct = 0
  let onTime = 0
  for (const note of expected) {
    const index = orderedHits.findIndex((hit, i) => hit.pitch === note.pitch && !used.has(i))
    if (index === -1) continue
    used.add(index)
    correct++
    if (Math.abs(orderedHits[index].beat - note.beat) * secondsPerBeat <= 0.18) onTime++
  }
  const denominator = expected.length + hits.length - correct
  return { pitch: Math.round(100 * correct / denominator), timing: Math.round(100 * onTime / denominator) }
}

export function matchesChord(expected: Set<number>, pressed: Set<number>): boolean {
  return expected.size === pressed.size && [...expected].every(pitch => pressed.has(pitch))
}
