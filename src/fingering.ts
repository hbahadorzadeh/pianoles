import type { Hand, Lesson } from './lessons'

export function hasFingerings(lesson: Lesson): boolean {
  return lesson.events.some(event => event.notes.some(note => note.finger !== undefined))
}

export function handDiagram(hand: Hand): string {
  const fingers = hand === 'left' ? [5, 4, 3, 2, 1] : [1, 2, 3, 4, 5]
  const handName = hand === 'left' ? 'Left hand' : 'Right hand'
  return `<div class="finger-hand" data-hand="${hand}" hidden>
    <div class="hand-diagram ${hand}" role="img" aria-label="${handName}">
      ${fingers.map(finger => `<span class="finger finger-${finger}" data-finger="${finger}"></span>`).join('')}
    </div>
    <span class="finger-label">${handName}</span>
  </div>`
}
