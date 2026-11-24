import assert from 'node:assert/strict'
import { test } from 'node:test'
import { lessons } from './catalog'

test('authored fingerings cover beginner notes without reusing a finger in a chord', () => {
  for (const lesson of lessons.slice(0, 15)) {
    for (const event of lesson.events) {
      const fingers = event.notes.map(note => note.finger)
      assert.ok(fingers.every(finger => finger !== undefined), `Lesson ${lesson.id}, beat ${event.beat}`)
      assert.equal(new Set(fingers).size, fingers.length)
    }
  }
})

test('fingering follows the hand and a change of position', () => {
  const bass = lessons[3]
  assert.equal(bass.events[0].notes[0].finger, 5)
  const shift = lessons[11]
  const notes = shift.events.filter(event => event.notes[0]?.spelling === 'G4')
  assert.deepEqual(notes.map(event => event.notes[0].finger), [5, 1, 1, 1])
})
