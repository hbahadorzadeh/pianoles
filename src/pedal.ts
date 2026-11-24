import type { Event, PedalCue } from './lessons'

export function pedalAt(cues: PedalCue[], beat: number): boolean {
  for (let index = cues.length - 1; index >= 0; index--) {
    if (cues[index].beat <= beat) return cues[index].down
  }
  return false
}

export function pedalSpans(cues: PedalCue[], start: number, end: number): { start: number; end: number }[] {
  const spans = []
  for (let index = 0; index + 1 < cues.length; index += 2) {
    const from = Math.max(start, cues[index].beat)
    const to = Math.min(end, cues[index + 1].beat)
    if (from < to) spans.push({ start: from, end: to })
  }
  return spans
}

export function playbackBeats(event: Event, cues: PedalCue[], passageEnd: number): number {
  const keyRelease = event.beat + event.duration * 0.91
  if (!pedalAt(cues, keyRelease)) return keyRelease - event.beat
  const lift = cues.find(cue => cue.beat > keyRelease && !cue.down)
  return Math.min(lift?.beat ?? passageEnd, passageEnd) - event.beat
}
