import type { Event, Hand, Lesson } from './lessons'

type Finger = 1 | 2 | 3 | 4 | 5
const cRight = { C4: 1, D4: 2, E4: 3, F4: 4, G4: 5 } as const
const cLeft = { C3: 5, D3: 4, E3: 3, F3: 2, G3: 1 } as const
const gRight = { G4: 1, A4: 2, B4: 3, C5: 4, D5: 5 } as const
const chromatic: readonly Finger[][] = [[1, 3, 2, 3], [1, 2, 3, 4], [5, 4, 3, 2], [3, 4]]

export const lastLessonWithFingerings = 15

export function fingerFor(lesson: Lesson, event: Event, spelling: string): Finger | undefined {
  if (lesson.id > lastLessonWithFingerings) return
  const measure = Math.floor(event.beat / lesson.meter)
  if (event.hand === 'left') return (cLeft as Record<string, Finger>)[spelling]
  if (lesson.id === 10) return chromatic[measure]?.[event.beat % lesson.meter]
  if (lesson.id === 11 && spelling === 'F#4') return 2
  const position = lesson.id === 11 || (lesson.id === 12 && measure >= 2) ? gRight : cRight
  return (position as Record<string, Finger>)[spelling]
}

export function handDiagram(hand: Hand): string {
  const fingers = hand === 'left' ? [5, 4, 3, 2, 1] : [1, 2, 3, 4, 5]
  const handName = hand === 'left' ? 'Left hand' : 'Right hand'
  return `<div class="finger-hand" data-hand="${hand}" hidden>
    <div class="hand-diagram ${hand}" role="img" aria-label="${handName}">
      ${fingers.map(finger => `<span class="finger finger-${finger}" data-finger="${finger}"><b>${finger}</b></span>`).join('')}
    </div>
    <span class="finger-label">${handName}</span>
  </div>`
}
